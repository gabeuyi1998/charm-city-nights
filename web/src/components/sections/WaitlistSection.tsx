"use client";
import { useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { WavyBackground } from "@/components/ui/wavy-background";
import { BorderBeam } from "@/components/ui/border-beam";
import { WaitlistForm } from "@/components/ui/WaitlistForm";

export function WaitlistSection() {
  const barRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(barRef, { once: true });
  const prefersReduced = useReducedMotion();
  const [waitlistCount] = useState(487);
  const goal = 500;
  const pct = Math.min((waitlistCount / goal) * 100, 100);

  return (
    <section id="waitlist" className="relative py-24 overflow-hidden">
      <WavyBackground
        className="absolute inset-0"
        containerClassName="absolute inset-0"
        colors={["#FF5C00", "#E9C349", "#FF5C00", "#2A2A2A"]}
        waveWidth={50}
        backgroundFill="#131313"
        blur={10}
        speed="slow"
        waveOpacity={0.06}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        <motion.div
          className="text-6xl mb-6 inline-block cursor-pointer"
          animate={prefersReduced ? {} : { y: [0, -15, 0], rotate: [0, -5, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.3, rotate: 15 }}
        >
          🦀
        </motion.div>

        <h2
          className="leading-none mb-4"
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "clamp(3rem, 8vw, 6rem)",
            background: "linear-gradient(135deg, #FF5C00 0%, #E9C349 50%, #FFB59A 100%)",
            backgroundSize: "200% 200%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "aurora-shift 4s ease infinite",
          }}
        >
          BE FIRST IN BALTIMORE
        </h2>

        <p className="text-[#E4BEB1]/70 text-lg mb-8 leading-relaxed">
          Join the waitlist. Get early access.<br />
          <strong className="text-[#E9C349]">Exclusive launch badges</strong> for the first 500.
        </p>

        <div ref={barRef} className="relative mb-8 rounded-xl bg-[#1C1B1B] p-4 overflow-hidden border border-[#5B4137]/20">
          <BorderBeam size={100} duration={10} colorFrom="#FF5C00" colorTo="#E9C349" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-[#E5E2E1]">
              🔥 <span className="text-[#FF5C00]">{waitlistCount}</span> of {goal} early access spots claimed
            </span>
            <span className="text-xs text-[#E4BEB1]/60">{goal - waitlistCount} left</span>
          </div>
          <div className="h-3 bg-[#0E0E0E] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #FF5C00, #E9C349)" }}
              initial={{ width: 0 }}
              animate={{ width: isInView ? `${pct}%` : 0 }}
              transition={{ duration: prefersReduced ? 0 : 1.5, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-[#E4BEB1]/50 mt-1.5 text-right">
            Only {goal - waitlistCount} spots remaining
          </p>
        </div>

        <WaitlistForm />
      </div>
    </section>
  );
}
