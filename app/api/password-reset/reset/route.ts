/**
 * POST /api/password-reset/reset
 * Reset password using token.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resetPassword, validatePasswordResetToken } from "@/lib/auth-server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { PASSWORD_REUSE_ERROR } from "@/lib/password-policy";

const resetSchema = z.object({
  token: z.string().min(10, "Invalid token"),
  password: z.string().min(10, "Password must be at least 10 characters"),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const clientIP = getClientIP(req);
    const rateLimit = await checkRateLimit("reset-password", clientIP);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfter: rateLimit.retryAfter },
        { status: 429 }
      );
    }

    // Parse and validate
    const body = await req.json();
    const result = resetSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { token, password } = result.data;

    // Validate token first
    const reset = await validatePasswordResetToken(token);
    if (!reset) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Reset password
    await resetPassword({ token, newPassword: password });

    return NextResponse.json({
      success: true,
      message: "Password reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("[API] POST /api/password-reset/reset error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Invalid or expired")) {
        return NextResponse.json(
          { error: "Invalid or expired reset token" },
          { status: 400 }
        );
      }
      if (error.message === PASSWORD_REUSE_ERROR) {
        return NextResponse.json({ error: PASSWORD_REUSE_ERROR }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
