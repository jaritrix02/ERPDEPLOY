import React, { useState, useEffect } from 'react';

const FlipUnit = ({ value, label }) => {
  const [current, setCurrent] = useState(value);
  const [next, setNext] = useState(value);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (value !== current) {
      setNext(value);
      setFlipping(true);
      const timer = setTimeout(() => {
        setCurrent(value);
        setFlipping(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [value]);

  const pad = (v) => String(v).padStart(2, '0');

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-12 h-16 bg-slate-900 rounded-lg shadow-2xl overflow-hidden border border-slate-700 perspective-1000">
        {/* Top Half (Static Next) */}
        <div className="absolute inset-0 flex items-center justify-center text-2xl font-black text-white bg-slate-800 h-1/2 border-b border-black/20">
          <span className="translate-y-4">{pad(next)}</span>
        </div>
        
        {/* Bottom Half (Static Current) */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center text-2xl font-black text-white bg-slate-900 h-1/2 overflow-hidden">
          <span className="-translate-y-4">{pad(current)}</span>
        </div>

        {/* Flipping Top Half (Current) */}
        <div className={`absolute inset-0 h-1/2 bg-slate-800 flex items-center justify-center text-2xl font-black text-white border-b border-black/20 origin-bottom transition-all duration-[250ms] ease-in z-20 ${flipping ? 'rotate-x-90 opacity-0' : 'rotate-x-0'}`}>
          <span className="translate-y-4">{pad(current)}</span>
        </div>

        {/* Flipping Bottom Half (Next) */}
        <div className={`absolute inset-x-0 bottom-0 h-1/2 bg-slate-900 flex items-center justify-center text-2xl font-black text-white origin-top transition-all duration-[250ms] ease-out delay-[250ms] z-20 ${flipping ? 'rotate-x-0 opacity-100' : 'rotate-x-90 opacity-0'}`}>
          <span className="-translate-y-4">{pad(next)}</span>
        </div>

        {/* Mechanical Hinge & Split Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-black z-30 shadow-[0_0_10px_rgba(0,0,0,0.5)]"></div>
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10 z-30"></div>
        
        {/* Subtle Inner Shadows for Depth */}
        <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-black/20 to-transparent z-10"></div>
        <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-t from-black/20 to-transparent z-10"></div>
      </div>
      <p className="text-[8px] font-black uppercase text-slate-500 mt-2 tracking-widest">{label}</p>
    </div>
  );
};

export default function FlipClock({ time }) {
  const h = time.getHours();
  const m = time.getMinutes();
  const s = time.getSeconds();

  return (
    <div className="flex gap-2 items-center">
      <FlipUnit value={h} label="Hrs" />
      <span className="text-xl font-black text-slate-700 dark:text-slate-500 -mt-6">:</span>
      <FlipUnit value={m} label="Min" />
      <span className="text-xl font-black text-slate-700 dark:text-slate-500 -mt-6">:</span>
      <FlipUnit value={s} label="Sec" />
    </div>
  );
}
