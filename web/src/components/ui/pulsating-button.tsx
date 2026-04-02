"use client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

interface PulsatingButtonProps {
  className?: string;
  children: React.ReactNode;
  pulseColor?: string;
  duration?: string;
  onClick?: () => void;
}

export function PulsatingButton({
  className,
  children,
  pulseColor = "#FF5C00",
  duration = "1.5s",
  onClick,
}: PulsatingButtonProps) {
  return (
    <motion.button
      className={cn(
        "relative text-center cursor-pointer flex justify-center items-center rounded-full",
        "bg-[#FF5C00] text-white font-bold px-6 py-3",
        "font-[var(--font-bebas)] tracking-widest text-base",
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <div
        className="absolute inset-0 rounded-full animate-ping opacity-75"
        style={{ backgroundColor: pulseColor, animationDuration: duration }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
