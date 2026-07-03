import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import crest from "@/assets/prumun-crest.png";
import { cn } from "@/lib/utils";

/* ── Initial loader (shown once on app mount) ─────────────────── */
const InitialLoader = ({ done }: { done: boolean }) => (
  <div
    aria-hidden
    className={cn(
      "fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white",
      "transition-opacity duration-700 pointer-events-none",
      done ? "opacity-0" : "opacity-100",
    )}
  >
    {/* Crest + rings */}
    <div className="relative flex items-center justify-center mb-8">
      <span className="absolute w-40 h-40 rounded-full border border-gold/20 animate-ping" />
      <span className="absolute w-28 h-28 rounded-full border border-gold/15 animate-ping"
        style={{ animationDelay: "150ms", animationDuration: "1.4s" }} />

      {/* Navy square container — matches screenshot logo style */}
      <div className="w-24 h-24 rounded-sm shadow-card bg-navy flex items-center justify-center">
        <img src={crest} alt="" width={72} height={72}
          className="w-16 h-16 object-contain drop-shadow-xl" />
      </div>
    </div>

    {/* Wordmark */}
    <span className="font-display font-bold tracking-[0.40em] text-sm text-navy mb-3">
      PRUMUN
    </span>

    {/* Gold loading dots */}
    <span className="flex gap-1.5">
      {[0, 1, 2].map(i => (
        <span key={i}
          className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce"
          style={{ animationDelay: `${i * 130}ms` }} />
      ))}
    </span>
  </div>
);

/* ── Slim top progress bar on route change ────────────────────── */
const RouteProgressBar = () => {
  const { pathname } = useLocation();
  const [active, setActive] = useState(false);
  const [width,  setWidth]  = useState(0);
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    if (timer.current) clearTimeout(timer.current);
    setActive(true); setWidth(30);
    timer.current = setTimeout(() => setWidth(85), 100);
    timer.current = setTimeout(() => {
      setWidth(100);
      timer.current = setTimeout(() => { setActive(false); setWidth(0); }, 300);
    }, 350);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [pathname]);

  return (
    <div aria-hidden
      className={cn(
        "fixed top-0 inset-x-0 z-[300] h-[2px] pointer-events-none transition-opacity duration-300",
        active ? "opacity-100" : "opacity-0",
      )}>
      <div
        className="h-full rounded-full transition-all duration-300 ease-out"
        style={{
          width: `${width}%`,
          background: "linear-gradient(90deg, #B8822E 0%, #E8B84B 50%, #C9973A 100%)",
          boxShadow: "0 0 8px rgba(201,151,58,0.50)",
        }}
      />
    </div>
  );
};

/* ── Composite export ─────────────────────────────────────────── */
export const PageTransition = () => {
  const [initialDone, setInitialDone] = useState(false);

  useEffect(() => {
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
