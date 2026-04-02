"use client";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  function scrollToWaitlist(e: React.MouseEvent) {
    e.preventDefault();
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between transition-all duration-300",
        scrolled
          ? "bg-[#0E0E0E]/80 backdrop-blur-xl border-b border-[#FF5C00]/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          : "bg-transparent"
      )}
    >
      <a href="#" className="flex items-center gap-2 group select-none">
        <motion.span
          className="text-2xl"
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
        >
          🦀
        </motion.span>
        <span
          className="text-xl text-[#FF5C00] tracking-[0.15em] uppercase"
          style={{ fontFamily: "var(--font-bebas)" }}
        >
          Charm City Nights
        </span>
      </a>

      <motion.button
        onClick={scrollToWaitlist}
        className="relative overflow-hidden rounded-full bg-[#FF5C00] text-white px-5 py-2.5 text-sm cursor-pointer tracking-[0.1em] uppercase"
        style={{ fontFamily: "var(--font-bebas)" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="absolute inset-0 rounded-full bg-[#FF5C00] animate-ping opacity-20" />
        <span className="relative z-10">Join Waitlist</span>
      </motion.button>
    </motion.nav>
  );
}
