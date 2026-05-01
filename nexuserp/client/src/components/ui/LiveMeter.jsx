import React from 'react';

export default function LiveMeter({ value, label, color = '#3b82f6', size = 120 }) {
  const radius = size * 0.4;
  const stroke = size * 0.1;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size }}>
      <svg height={size} width={size} className="transform -rotate-90">
        <circle
          stroke="#e2e8f0"
          strokeWidth={stroke}
          fill="transparent"
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
          className="dark:stroke-slate-800"
        />
        <circle
          stroke={color}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-out' }}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="transparent"
          r={normalizedRadius}
          cx={size / 2}
          cy={size / 2}
          className="animate-pulse"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-black text-black dark:text-white leading-none">{value}%</span>
        {label && <span className="text-[8px] font-bold uppercase text-slate-400 mt-1">{label}</span>}
      </div>
    </div>
  );
}
