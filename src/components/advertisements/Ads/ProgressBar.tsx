"use client";

import React from "react";

interface ProgressBarProps {
  duration: number; // duração total em segundos
  isActive: boolean; // se deve estar animando
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  duration,
  isActive,
  className = "",
}) => {
  return (
    <div
      className={`w-full h-1 bg-white/20 overflow-hidden ${className}`}
    >
      <div
        className={`h-full bg-white transition-all ease-linear ${
          isActive ? "w-full" : "w-0"
        }`}
        style={{
          transitionDuration: isActive ? `${duration}s` : "0s",
        }}
      />
    </div>
  );
};