import { useEffect, useRef, useState } from "react";

type Tick = { d: number; h: number; m: number; s: number };

function calcRemaining(target: Date): Tick {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff / 3_600_000) % 24),
    m: Math.floor((diff / 60_000) % 60),
    s: Math.floor((diff / 1_000) % 60),
  };
}

const Unit = ({ value, label }: { value: number; label: string }) => (
  <div className="glass rounded-2xl p-4 md:p-6 text-center min-w-[80px] md:min-w-[110px] hover-lift select-none">
    <div className="font-display font-bold text-3xl md:text-5xl gradient-text-deep tabular-nums">
      {String(value).padStart(2, "0")}
    </div>
    <div className="text-[10px] md:text-xs tracking-[0.2em] text-muted-foreground font-semibold mt-1">
      {label}
    </div>
  </div>
);

interface CountdownProps {
  target: Date;
  title?: string;
}

export const Countdown = ({ target, title }: CountdownProps) => {
  const [tick, setTick] = useState<Tick>(() => calcRemaining(target));
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    const id = setInterval(() => setTick(calcRemaining(targetRef.current)), 1_000);
    return () => clearInterval(id);
  }, []);

  const isOver = tick.d === 0 && tick.h === 0 && tick.m === 0 && tick.s === 0;

  return (
    <div className="text-center" aria-live="polite" aria-atomic="true">
      {title && (
        <p className="text-sm tracking-[0.3em] text-primary/80 font-semibold mb-4 uppercase">
          {isOver ? "Conference is live!" : title}
        </p>
      )}
      <div className="flex items-center justify-center gap-2 md:gap-4 flex-wrap">
        <Unit value={tick.d} label="DAYS" />
        <Unit value={tick.h} label="HOURS" />
        <Unit value={tick.m} label="MINUTES" />
        <Unit value={tick.s} label="SECONDS" />
      </div>
    </div>
  );
};
