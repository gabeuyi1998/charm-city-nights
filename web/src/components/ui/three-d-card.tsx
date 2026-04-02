"use client";
import { cn } from "@/lib/utils";
import React, { createContext, useContext, useRef, useState } from "react";

type MouseEnterContextType = [boolean, React.Dispatch<React.SetStateAction<boolean>>];
const MouseEnterContext = createContext<MouseEnterContextType | undefined>(undefined);

export function ThreeDCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseEntered, setIsMouseEntered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 25;
    const y = (e.clientY - top - height / 2) / 25;
    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
  }

  function handleMouseLeave() {
    if (!containerRef.current) return;
    containerRef.current.style.transform = "rotateY(0deg) rotateX(0deg)";
    setIsMouseEntered(false);
  }

  return (
    <MouseEnterContext.Provider value={[isMouseEntered, setIsMouseEntered]}>
      <div style={{ perspective: "1000px" }} className={className}>
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsMouseEntered(true)}
          onMouseLeave={handleMouseLeave}
          style={{ transformStyle: "preserve-3d", transition: "transform 0.1s ease" }}
          className="relative"
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  );
}

export function ThreeDCardBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn("h-full w-full", className)}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}

export function ThreeDCardItem({
  as: Tag = "div",
  className,
  children,
  translateZ = 0,
  ...rest
}: {
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
  translateZ?: number | string;
  [key: string]: unknown;
}) {
  const context = useContext(MouseEnterContext);
  const isMouseEntered = context?.[0] ?? false;
  return (
    <Tag
      className={cn(className)}
      style={{
        transform: isMouseEntered ? `translateZ(${translateZ}px)` : "translateZ(0)",
        transition: "transform 0.1s ease",
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
