import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import crest from "@/assets/prumun-crest.png";
import { cn } from "@/lib/utils";

/**
 * Two responsibilities, cleanly separated:
 *
 * 1. InitialLoader — shown once on app mount, disappears after fonts/assets
 *    settle (~500 ms). Never shown again.
 *
 * 2. RouteProgressBar — a slim top bar (like NProgress / YouTube) that
 *    appears for 400 ms on every route change. Non-intrusive; never blocks
 *    content. Replaces the 650 ms full-screen takeover.
 */

// ─── Initial loader ───────────────────────────────────────────────────────────

const InitialLoader = ({ done }: { done: boolean }) => (
  <div
    aria-hidden
    className={cn(
      "fixed inset-0 z-[200] flex flex-col items-center justify-center",
      "bg-gradient-to-br from-background via-background to-primary/5",
      "transition-opacity duration-700 pointer-events-none",
      done ? "opacity-0" : "opacity-100",
    )}
  >
    {/* Outer glow ring */}
    <div className="relative flex items-center justify-center mb-8">
      <span className="absolute w-44 h-44 rounded-full border border-primary/20 animate-ping" />
      <span
        className="absolute w-32 h-32 rounded-full border border-primary/30 animate-ping"
        style={{ animationDelay: "150ms", animationDuration: "1.4s" }}
      />
      <div className="w-28 h-28 rounded-full ring-4 ring-primary/30 shadow-elegant bg-card/80 backdrop-blur-xl flex items-center justify-center">
        <img src={crest} alt="" width={80} height={80} className="w-20 h-20 object-contain drop-shadow-2xl animate-float" />
      </div>
    </div>

    <span className="font-display font-bold tracking-[0.45em] text-sm gradient-text-deep mb-3">
      PRUMUN
    </span>

    {/* Loading dots */}
    <span className="flex gap-1.5">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce"
          style={{ animationDelay: `${i * 130}ms` }}
        />
      ))}
    </span>
  </div>
);

// ─── Route progress bar ───────────────────────────────────────────────────────

const RouteProgressBar = () => {
  const { pathname } = useLocation();
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirst = useRef(true);

  useEffect(() => {
    // Skip on the very first render (that's the initial loader's job).
    if (isFirst.current) { isFirst.current = false; return; }

    if (timerRef.current) clearTimeout(timerRef.current);
    setActive(true);
    setWidth(30);

    // Fast-forward to 85% quickly, then finish.
    timerRef.current = setTimeout(() => setWidth(85), 100);
    timerRef.current = setTimeout(() => {
      setWidth(100);
      timerRef.current = setTimeout(() => { setActive(false); setWidth(0); }, 300);
    }, 350);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [pathname]);

  return (
    <div
      aria-hidden
      className={cn(
        "fixed top-0 inset-x-0 z-[300] h-[3px] pointer-events-none",
        "transition-opacity duration-300",
        active ? "opacity-100" : "opacity-0",
      )}
    >
      <div
        className="h-full bg-gradient-primary rounded-full shadow-glow transition-all duration-300 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

// ─── Composite export ─────────────────────────────────────────────────────────

export const PageTransition = () => {
  const [initialDone, setInitialDone] = useState(false);

  useEffect(() => {
    // Dismiss after a brief window for fonts + first paint.
    const t = setTimeout(() => setInitialDone(true), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <InitialLoader done={initialDone} />
      <RouteProgressBar />
    </>
  );
};
