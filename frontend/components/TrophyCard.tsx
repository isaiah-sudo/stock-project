"use client";

import { MouseEvent, useRef, useState } from "react";

export function TrophyCard({ rank, icon, label }: { rank: 1 | 2 | 3; icon: string; label: string; }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -15; // Max 15 deg
    const rotateY = ((x - centerX) / centerX) * 15;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setRotation({ x: 0, y: 0 });
  };

  let borderGlow = "";
  if (rank === 1) borderGlow = "border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]";
  else if (rank === 2) borderGlow = "border-slate-300 shadow-[0_0_20px_rgba(203,213,225,0.5)]";
  else if (rank === 3) borderGlow = "border-amber-600 shadow-[0_0_20px_rgba(217,119,6,0.5)]";

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative flex flex-1 h-32 min-w-[100px] max-w-[180px] shrink-0 flex-col items-center justify-center rounded-2xl border-2 bg-gradient-to-br from-white to-slate-50 dark:from-slate-700 dark:to-slate-800 p-2 text-center transition-all ${borderGlow}`}
      style={{
        transformStyle: "preserve-3d",
        transform: `perspective(800px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${isHovering ? 1.05 : 1})`,
        transition: isHovering ? "none" : "all 0.5s ease",
      }}
    >
      <div 
        className="mb-2 text-4xl drop-shadow-md"
        style={{ transform: "translateZ(30px)" }}
      >
        {icon}
      </div>
      <div 
        className="text-xs font-black text-slate-800 dark:text-slate-200"
        style={{ transform: "translateZ(20px)" }}
      >
        {label}
      </div>
    </div>
  );
}
