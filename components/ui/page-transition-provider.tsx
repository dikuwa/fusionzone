/**
 * PageTransitionProvider
 *
 * Manages page-level loading states and smooth route transitions.
 *
 * - Initial load: shows a full-screen branded loader BEFORE any content renders.
 * - Route changes: shows a slim top progress bar + brief overlay while the new page loads.
 * - Content fade: new page content fades in smoothly after loading completes.
 * - Respects prefers-reduced-motion.
 *
 * Design notes:
 * - Children are always rendered (preserves SSR, avoids double-mount via hidden div).
 * - During initial load, content is visually hidden via opacity + pointer-events.
 * - Route changes use a top progress bar for fast feedback, plus a brief overlay.
 */
"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// ── Top progress bar ──

function RouteProgressBar({ visible }: { visible: boolean }) {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-[10000] h-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <motion.div
            className="h-full bg-primary"
            initial={{ scaleX: 0, transformOrigin: "0% 50%" }}
            animate={{ scaleX: 1, transformOrigin: "0% 50%" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Hide the CSS-only initial loader (don't remove from DOM to avoid confusing React) ──

function hideCssLoader() {
  const el = document.getElementById("dt-initial-loader");
  if (el) {
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    el.style.transition = "opacity 0.3s ease";
  }
}

// ── Main provider ──

export function PageTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();

  const prevPathname = useRef(pathname);
  const routeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase] = useState<
    "initial-loading" | "ready" | "routing"
  >("initial-loading");

  // ── Initial load ──
  useEffect(() => {
    // Hide the CSS-only skeleton (don't remove from DOM — React manages these nodes)
    hideCssLoader();

    if (reducedMotion) {
      setPhase("ready");
      return;
    }

    // Brief branded loader, then reveal
    const timer = setTimeout(() => setPhase("ready"), 300);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  // ── Route change ──
  useEffect(() => {
    const isRouteChange = prevPathname.current !== pathname;
    if (!isRouteChange) return;

    prevPathname.current = pathname;

    if (reducedMotion) return;

    // Cancel any pending route timer from a previous change
    if (routeTimerRef.current) {
      clearTimeout(routeTimerRef.current);
    }

    setPhase("routing");
    routeTimerRef.current = setTimeout(() => setPhase("ready"), 200);

    return () => {
      if (routeTimerRef.current) {
        clearTimeout(routeTimerRef.current);
        routeTimerRef.current = null;
      }
    };
  }, [pathname, reducedMotion]);

  const isLoading = phase === "initial-loading";
  const isRouting = phase === "routing";
  const isReady = phase === "ready";

  return (
    <>
      {/* ── Full-screen initial loader ── */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="init-loader"
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-background"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: reducedMotion ? 0 : 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <div
              className="flex flex-col items-center justify-center gap-6"
              style={{
                animation: reducedMotion
                  ? "none"
                  : "pageLoaderFadeIn 0.4s ease-out",
              }}
            >
              <div className="flex items-baseline gap-0.5 select-none">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  Fusion
                </span>
                <span className="text-2xl font-bold tracking-tight text-primary">
                  Zone
                </span>
              </div>
              <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full w-full rounded-full bg-primary"
                  style={{
                    animation: "pageLoaderSlide 1.4s ease-in-out infinite",
                  }}
                />
              </div>
              <span className="sr-only">Loading…</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Route change progress bar (above overlay) ── */}
      <RouteProgressBar visible={isRouting} />

      {/* ── Route change overlay ── */}
      <AnimatePresence>
        {isRouting && (
          <motion.div
            key="route-overlay"
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: reducedMotion ? 0 : 0.12,
            }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-xs font-medium text-muted-foreground">
                Loading…
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content wrapper ── */}
      {/* Children are ALWAYS rendered (preserves SSR, avoids double-mount).
          During initial load they're visually hidden via CSS. */}
      <div
        style={{
          opacity: isLoading ? 0 : 1,
          pointerEvents: isLoading ? "none" : "auto",
          transition: reducedMotion
            ? "none"
            : "opacity 0.3s ease",
        }}
      >
        <AnimatePresence mode="wait">
          {isReady && (
            <motion.div
              key={pathname}
              initial={
                reducedMotion ? {} : { opacity: 0, y: 6 }
              }
              animate={{ opacity: 1, y: 0 }}
              exit={
                reducedMotion ? {} : { opacity: 0, y: -4 }
              }
              transition={{
                duration: reducedMotion ? 0 : 0.25,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
