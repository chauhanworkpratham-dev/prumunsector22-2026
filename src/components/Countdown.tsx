import { useEffect, useRef, useState } from "react";

type Tick = { d: number; h: number; m: number; s: number };

function calcTick(target: Date): Tick {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff / 3_600_000) % 24),
    m: Math.floor((diff / 60_000) % 60),
    s: Math.floor((diff / 1_000) % 60),
  };
}

const Unit = ({ value, label }: { value: number; label: string }) => (
  <div className="glass rounded-2xl px-4 py-4 md:px-6 md:py-5 text-center min-w-[72px] md:min-w-[100px] hover-lift select-none">
    <div className="font-display font-bold text-3xl md:text-4xl gradient-text-deep tabular-nums leading-none">
      {String(value).padStart(2, "0")}
    </div>
    <div className="text-[9px] md:text-[10px] tracking-[0.22em] text-muted-foreground font-semibold mt-2 uppercase">
      {label}
    </div>
  </div>
);

const Sep = () => (
  <span className="font-display font-bold text-2xl text-primary/30 select-none pb-2">:</span>
);

interface Props { target: Date; title?: string; }

export const Countdown = ({ target, title }: Props) => {
  const ref = useRef(target);
  ref.current = target;

  const [tick, setTick] = useState<Tick>(() => calcTick(target));

  useEffect(() => {
    const id = setInterval(() => setTick(calcTick(ref.current)), 1_000);
    return () => clearInterval(id);
  }, []);

  const isOver = Object.values(tick).every(v => v === 0);

  return (
    <div className="text-center" aria-live="polite" aria-atomic="true">
      {title && (
        <p className="text-[10px] tracking-[0.35em] text-primary/70 font-semibold mb-4 uppercase">
          {isOver ? "Conference is live!" : title}
        </p>
      )}
      <div className="flex items-center justify-center gap-1.5 md:gap-2.5 flex-wrap">
        <Unit value={tick.d} label="Days" />
        <Sep />
        <Unit value={tick.h} label="Hours" />
        <Sep />
        <Unit value={tick.m} label="Min" />
        <Sep />
        <Unit value={tick.s} label="Sec" />
      </div>
    </div>
  );
};
