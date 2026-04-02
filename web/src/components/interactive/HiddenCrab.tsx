"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type CrabPos = "hero" | "features" | "badges" | "footer";

interface HiddenCrabProps {
  position: CrabPos;
  className?: string;
}

export function HiddenCrab({ position, className }: HiddenCrabProps) {
  function handleClick() {
    window.dispatchEvent(new CustomEvent("crab-found", { detail: { position } }));
    window.dispatchEvent(
      new CustomEvent("xp-gain", {
        detail: { amount: 50, x: window.innerWidth / 2, y: window.innerHeight / 3 },
      })
    );
  }

  return (
    <motion.button
      onClick={handleClick}
      className={cn(
        "cursor-pointer select-none bg-transparent border-0 p-0 leading-none",
        "opacity-10 hover:opacity-100 transition-opacity duration-300",
        className
      )}
      whileHover={{ scale: 1.4 }}
      whileTap={{ rotate: [0, -15, 15, -10, 10, 0] }}
      transition={{ duration: 0.4 }}
      aria-label="Find the hidden crab"
    >
      🦀
    </motion.button>
  );
}
