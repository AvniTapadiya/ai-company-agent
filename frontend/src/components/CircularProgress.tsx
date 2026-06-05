import React, { useEffect, useState } from 'react';

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 10,
  className = '',
}: CircularProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 150);
    return () => clearTimeout(timer);
  }, [value]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  // Dynamic colors based on score
  let strokeColor = 'stroke-zinc-500'; // Cold/Low
  let textColorClass = 'text-zinc-400';
  let glowColorClass = 'shadow-zinc-500/20';

  if (value >= 75) {
    strokeColor = 'stroke-rose-500'; // Hot
    textColorClass = 'text-rose-500';
    glowColorClass = 'shadow-rose-500/30';
  } else if (value >= 40) {
    strokeColor = 'stroke-amber-500'; // Warm
    textColorClass = 'text-amber-500';
    glowColorClass = 'shadow-amber-500/30';
  } else {
    strokeColor = 'stroke-zinc-500'; // Cold
    textColorClass = 'text-zinc-400';
    glowColorClass = 'shadow-zinc-500/10';
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      {/* Outer glow aura for modern SaaS visual style */}
      <div 
        className={`absolute inset-0 rounded-full blur-xl opacity-35 transition-all duration-1000 ${glowColorClass}`} 
        style={{ margin: strokeWidth }}
      />
      
      <svg className="transform -rotate-90 relative z-10" width={size} height={size}>
        {/* Background Circle */}
        <circle
          className="stroke-zinc-800"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Foreground Circle with offset */}
        <circle
          className={`transition-all duration-1000 ease-out ${strokeColor}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Centered Text */}
      <div className="absolute flex flex-col items-center justify-center z-10">
        <span className="text-3xl font-extrabold text-white tracking-tight">
          {Math.round(animatedValue)}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${textColorClass}`}>
          Score
        </span>
      </div>
    </div>
  );
}
