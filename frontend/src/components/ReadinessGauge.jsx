import React from "react";

export default function ReadinessGauge({ score = 0 }) {
  const radius = 78;
  const circ = Math.PI * radius; // semi-circle
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circ - (clamped / 100) * circ;

  const color = clamped >= 80 ? "#10B981" : clamped >= 60 ? "#FF9933" : clamped >= 40 ? "#F59E0B" : "#EF4444";

  return (
    <div className="flex flex-col items-center" data-testid="readiness-gauge">
      <svg viewBox="0 0 200 110" className="w-full max-w-[280px]">
        <path d={`M 20 100 A ${radius} ${radius} 0 0 1 180 100`} fill="none" stroke="#E2E8F0" strokeWidth="14" strokeLinecap="round" />
        <path
          d={`M 20 100 A ${radius} ${radius} 0 0 1 180 100`}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 800ms ease-out, stroke 300ms" }}
        />
        <text x="100" y="85" textAnchor="middle" fontSize="36" fontWeight="800" fill="#0B192C">{clamped}</text>
        <text x="100" y="103" textAnchor="middle" fontSize="10" fill="#64748B" letterSpacing="2">/ 100</text>
      </svg>
    </div>
  );
}
