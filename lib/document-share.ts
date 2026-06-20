/**
 * Document short-link service using Prisma (Postgres) as the primary store,
 * with Redis (Upstash) as a read cache for fast lookups.
 *
 * Maps short random codes to signed document tokens so that customers
 * receive compact branded URLs like https://example.com/d/r8K4pQ
 * instead of long token URLs.
 *
 * The underlying signed token (from document-tokens.ts) encodes all
 * document data, so links survive redeploys and are self-verifying.
 *
 * The database is the source of truth — Redis is only a cache layer.
 * This ensures links are never lost, even if Redis is unavailable.
 */

import { db } from "./db";
import { cache } from "./cache";
import { generateDocumentToken, verifyDocumentToken, type DocumentType } from "./document-tokens";
import { getAppUrl } from "./app-url";
import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShortLinkRecord {
  shortCode: string;
  token: string;
  type: DocumentType;
  referenceId: string;
  documentNumber: string;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  lastAccessedAt: string | null;
  accessCount: number;
}

export type ShortLinkErrorCode = "NOT_FOUND" | "EXPIRED" | "REVOKED" | "TOKEN_INVALID";

export interface ShortLinkError {
  code: ShortLinkErrorCode;
  message: string;
}

export type ResolveResult =
  | { ok: true; record: ShortLinkRecord; token: string }
  | { ok: false; code: ShortLinkErrorCode; message: string };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Length of the random short code in characters */
const SHORT_CODE_LENGTH = 7;

/** Cache TTL in seconds (2 hours for fast reads, DB is source of truth) */
const CACHE_TTL_SECONDS = 2 * 60 * 60;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateShortCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(SHORT_CODE_LENGTH);
  let code = "";
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

function redisKey(code: string): string {
  return `shortlink:${code}`;
}

export function getShortLinkUrl(code: string): string {
  return `${getAppUrl()}/d/${code}`;
}

/** Build a ShortLinkRecord from a database DocumentShare row. */
function toRecord(row: NonNullable<Awaited<ReturnType<typeof findDbRecord>>>): ShortLinkRecord {
  return {
    shortCode: row.shortCode,
    token: row.token,
    type: row.documentType as DocumentType,
    referenceId: row.referenceId,
    documentNumber: row.documentNumber,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
    revokedAt: row.revokedAt?.toISOString() ?? null,
    lastAccessedAt: row.lastAccessedAt?.toISOString() ?? null,
    accessCount: row.accessCount,
  };
}

/** Look up a DocumentShare from the database by short code. */
async function findDbRecord(code: string) {
  if (!db) return null;
  try {
    return await db.documentShare.findUnique({
      where: { shortCode: code },
    });
  } catch (err) {
    console.error("[DocumentShare] DB lookup failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create a short link for a document.
 * Reuses existing valid links for the same reference to avoid duplicates.
 */
export async function createShortLink(
  type: DocumentType,
  referenceId: string,
  documentNumber?: string,
  data?: Record<string, unknown>,
  ttlDays = 90,
): Promise<{ record: ShortLinkRecord; url: string }> {
  // Try the database first
  if (db) {
    try {
      const existing = await db.documentShare.findFirst({
        where: {
          referenceId,
          documentType: type,
          revokedAt: null,
          OR: [
            { expiresAt: null },
            { expiresAt: { gte: new Date() } },
          ],
        },
        orderBy: { createdAt: "desc" },
      });

      if (existing) {
        const record = toRecord(existing);
        // Warm the cache
        cache.set(redisKey(record.shortCode), JSON.stringify(record), {
          ex: CACHE_TTL_SECONDS,
        }).catch(() => {});
        return { record, url: getShortLinkUrl(record.shortCode) };
      }
    } catch (err) {
      console.warn("[DocumentShare] DB lookup failed, falling back to new link:", err);
    }
  }

  // Generate new short code (retry on collision)
  let shortCode = "";
  let attempts = 0;
  while (attempts < 5) {
    shortCode = generateShortCode();
    if (db) {
      const existing = await db.documentShare.findUnique({ where: { shortCode } }).catch(() => null);
      if (existing) {
        attempts++;
        continue;
      }
    }
    break;
  }

  const token = generateDocumentToken(type, referenceId, documentNumber || referenceId, data as any, ttlDays);

  const now = new Date();
  const expiresAt = ttlDays > 0 ? new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000) : null;

  const record: ShortLinkRecord = {
    shortCode,
    token,
    type,
    referenceId,
    documentNumber: documentNumber || referenceId,
    createdAt: now.toISOString(),
    expiresAt: expiresAt?.toISOString() ?? null,
    revokedAt: null,
    lastAccessedAt: null,
    accessCount: 0,
  };

  // Persist to database
  if (db) {
    try {
      await db.documentShare.create({
        data: {
          shortCode,
          token,
          documentType: type,
          referenceId,
          documentNumber: documentNumber || referenceId,
          expiresAt,
        },
      });
    } catch (err) {
      console.error("[DocumentShare] DB create failed:", err);
    }
  }

  // Also cache in Redis for fast reads
  cache.set(redisKey(shortCode), JSON.stringify(record), {
    ex: CACHE_TTL_SECONDS,
  }).catch(() => {});

  return { record, url: getShortLinkUrl(shortCode) };
}

/**
 * Resolve a short code to a document token.
 * Checks the Redis cache first, then the database.
 */
export async function resolveShortLink(rawCode: string): Promise<ResolveResult> {
  const code = rawCode.trim();

  // 1. Try Redis cache (fast path)
  try {
    const raw = await cache.get<string>(redisKey(code));
    if (raw) {
      try {
        const record: ShortLinkRecord = JSON.parse(raw);
        const validation = validateRecord(record);
        if (validation.ok) return validation;
      } catch {
        // Corrupted cache entry — fall through to DB
      }
    }
  } catch {
    // Redis unavailable — fall through to DB
  }

  // 2. Try database
  const row = await findDbRecord(code);
  if (!row) {
    return { ok: false, code: "NOT_FOUND", message: "This document link is invalid or has expired." };
  }

  const record = toRecord(row);
  const validation = validateRecord(record);
  if (!validation.ok) return validation;

  // Verify the signed token
  const payload = verifyDocumentToken(record.token);
  if (!payload) {
    return { ok: false, code: "TOKEN_INVALID", message: "This document link is invalid or has expired." };
  }

  // Update access stats (fire-and-forget)
  updateAccessStats(code, record).catch(() => {});

  return { ok: true, record, token: record.token };
}

/**
 * Validate the short link record for expiration and revocation.
 */
function validateRecord(record: ShortLinkRecord): ResolveResult {
  if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
    return {
      ok: false,
      code: "EXPIRED",
      message: "This document link has expired. Please contact FusionZone for a new copy.",
    };
  }
  if (record.revokedAt) {
    return {
      ok: false,
      code: "REVOKED",
      message: "This document link is no longer available.",
    };
  }
  return { ok: true, record, token: record.token };
}

/**
 * Update access stats (access count, last accessed time).
 */
async function updateAccessStats(code: string, record: ShortLinkRecord) {
  record.lastAccessedAt = new Date().toISOString();
  record.accessCount += 1;

  // Update cache
  cache.set(redisKey(code), JSON.stringify(record), {
    ex: CACHE_TTL_SECONDS,
  }).catch(() => {});

  // Update database
  if (db) {
    try {
      await db.documentShare.update({
        where: { shortCode: code },
        data: {
          lastAccessedAt: new Date(),
          accessCount: { increment: 1 },
        },
      });
    } catch {
      // Non-critical
    }
  }
}

/**
 * Revoke a short link.
 */
export async function revokeShortLink(code: string): Promise<boolean> {
  if (db) {
    try {
      await db.documentShare.update({
        where: { shortCode: code },
        data: { revokedAt: new Date() },
      });
      // Invalidate cache
      cache.del(redisKey(code)).catch(() => {});
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
