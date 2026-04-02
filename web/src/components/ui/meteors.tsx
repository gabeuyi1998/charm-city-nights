"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

type MeteorStyle = {
  left: string;
  animationDelay: string;
  animationDuration: string;
};

export const Meteors = ({
  number,
  className,
}: {
  number?: number;
  className?: string;
}) => {
  const count = number || 20;
  const [styles, setStyles] = useState<MeteorStyle[]>([]);

  useEffect(() => {
    setStyles(
      Array.from({ length: count }, () => ({
        left: Math.floor(Math.random() * (400 - -400) + -400) + "px",
        animationDelay: (Math.random() * (0.8 - 0.2) + 0.2).toFixed(6) + "s",
        animationDuration: Math.floor(Math.random() * (10 - 2) + 2) + "s",
      }))
    );
  }, [count]);

  if (styles.length === 0) return null;

  return (
    <>
      {styles.map((style, idx) => (
        <span
          key={"meteor" + idx}
          className={cn(
            "animate-meteor-effect absolute top-1/2 left-1/2 h-0.5 w-0.5 rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg]",
            "before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-[50%] before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-[#64748b] before:to-transparent",
            className
          )}
          style={{ top: 0, ...style }}
        />
      ))}
    </>
  );
};
