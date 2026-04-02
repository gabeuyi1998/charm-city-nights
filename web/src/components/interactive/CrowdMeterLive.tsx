"use client";
import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

type CrowdState = { label: string; color: string; bg: string; glow: string };

function getCrowdState(c: number): CrowdState {
  if (c <= 33) return { label: "QUIET", color: "#60A5FA", bg: "#1e3a5f", glow: "rgba(96,165,250,0.3)" };
  if (c <= 66) return { label: "FILLING UP", color: "#F59E0B", bg: "#3b2a0a", glow: "rgba(245,158,11,0.3)" };
  if (c <= 85) return { label: "GETTING PACKED", color: "#FF5C00", bg: "#3b1a00", glow: "rgba(255,92,0,0.3)" };
  return { label: "🔥 PACKED", color: "#FF3366", bg: "#3b0019", glow: "rgba(255,51,102,0.5)" };
}

export function CrowdMeterLive() {
  const [crowd, setCrowd] = useState(45);
  const prefersReduced = useReducedMotion();
  const state = getCrowdState(crowd);

  return (
    <div
      className="relative rounded-2xl bg-[#1C1B1B] border border-[#5B4137]/20 p-6 overflow-hidden transition-shadow duration-500"
      style={{ boxShadow: `0 0 40px ${state.glow}` }}
    >
      <motion.div
        className="absolute inset-0 opacity-20 rounded-2xl"
        animate={{ backgroundColor: state.bg }}
        transition={{ duration: 0.5 }}
      />
      <div className="relative z-10">
        <div className="text-center mb-6">
          <p className="text-xs text-[#E4BEB1]/60 mb-1">Demo: Drag to simulate crowd level</p>
          <motion.div
            className="tracking-wider"
            style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(2rem, 8vw, 3rem)" }}
            animate={{ color: state.color }}
            transition={{ duration: 0.3 }}
          >
            {state.label}
          </motion.div>
        </div>

        <div className="relative h-24 mb-6 rounded-xl overflow-hidden bg-[#0E0E0E]">
          <div className="absolute inset-0 flex flex-wrap content-end gap-0.5 p-2">
            {Array.from({ length: Math.floor(crowd * 0.4) }).map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-3 rounded-t-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1, backgroundColor: i % 3 === 0 ? state.color : "#2A2A2A" }}
                transition={prefersReduced ? {} : { delay: i * 0.02, duration: 0.2 }}
              />
            ))}
          </div>
          <div className="absolute top-2 left-3 right-3 h-4 bg-[#2A2A2A] rounded" />
          <AnimatePresence>
            {crowd >= 90 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute top-2 right-2 bg-[#FF3366] text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                PACKED
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={crowd}
          onChange={(e) => setCrowd(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{ background: `linear-gradient(90deg, ${state.color} ${crowd}%, #2A2A2A ${crowd}%)` }}
        />
        <div className="flex justify-between mt-2">
          <span className="text-xs text-[#E4BEB1]/40">0%</span>
          <span style={{ fontFamily: "var(--font-bebas)", fontSize: "1.5rem", color: state.color }}>{crowd}%</span>
          <span className="text-xs text-[#E4BEB1]/40">100%</span>
        </div>

        <motion.p
          key={state.label}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center text-sm text-[#E4BEB1]/70"
        >
          {crowd <= 33 && "Empty dance floor. Great time to snag a seat!"}
          {crowd > 33 && crowd <= 66 && "The vibe is picking up. Worth heading over."}
          {crowd > 66 && crowd <= 85 && "Getting busy! Grab your spot before it's gone."}
          {crowd > 85 && crowd < 90 && "Almost at capacity! Move fast or miss out."}
          {crowd >= 90 && "🔥 MAX ENERGY — This place is ON FIRE tonight!"}
        </motion.p>
      </div>
    </div>
  );
}
