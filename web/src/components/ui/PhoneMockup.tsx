"use client";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";

function DiscoverScreen() {
  return (
    <div className="flex flex-col gap-2 p-3">
      <div
        className="text-[9px] text-[#FF5C00] tracking-widest mb-1 uppercase"
        style={{ fontFamily: "var(--font-bebas)" }}
      >
        Tonight in Bmore
      </div>
      {[
        { name: "The Raven", hood: "Fells Point", crowd: 87, live: true },
        { name: "Barcocina", hood: "Canton", crowd: 72, live: false },
        { name: "Loco Hombre", hood: "Fed Hill", crowd: 94, live: true },
      ].map((bar) => (
        <div
          key={bar.name}
          className="bg-[#2A2A2A] rounded-lg p-2 flex items-center justify-between"
        >
          <div>
            <div className="text-[8px] font-bold text-[#E5E2E1]">{bar.name}</div>
            <div className="text-[7px] text-[#E4BEB1]/60">{bar.hood}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div
              className="text-[7px] font-bold rounded-full px-1.5 py-0.5"
              style={{
                background: bar.crowd > 85 ? "#FF5C00" : "transparent",
                color: bar.crowd > 85 ? "white" : "#E9C349",
                border: bar.crowd > 85 ? "none" : "1px solid rgba(233,195,73,0.4)",
              }}
            >
              {bar.crowd}%
            </div>
            {bar.live && (
              <div className="flex items-center gap-0.5">
                <div className="w-1 h-1 rounded-full bg-[#FF5C00] animate-pulse" />
                <span className="text-[6px] text-[#FF5C00]">LIVE</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function MapScreen() {
  return (
    <div className="relative w-full h-full bg-[#0E0E0E] overflow-hidden">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,92,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,92,0,0.3) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      {[
        { x: "30%", y: "35%", size: 10 },
        { x: "65%", y: "55%", size: 7 },
        { x: "45%", y: "70%", size: 10 },
        { x: "20%", y: "60%", size: 5 },
        { x: "75%", y: "30%", size: 7 },
      ].map((dot, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-[#FF5C00] hotspot-pulse"
          style={{
            left: dot.x,
            top: dot.y,
            width: dot.size,
            height: dot.size,
            animationDelay: `${i * 0.4}s`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
      <div className="absolute bottom-2 left-2 right-2 glass-card rounded-lg p-2">
        <div className="text-[7px] text-[#E9C349] font-bold tracking-wider">LIVE HOTSPOTS</div>
        <div className="text-[8px] text-[#E5E2E1]">5 packed bars nearby</div>
      </div>
    </div>
  );
}

function BadgesScreen() {
  const badges = ["🦀", "⚡", "🦅", "⚓", "🦉", "🎸", "🍺", "🗺️", "👑"];
  return (
    <div className="p-2">
      <div
        className="text-[9px] text-[#E9C349] tracking-widest mb-2 uppercase"
        style={{ fontFamily: "var(--font-bebas)" }}
      >
        B-More Dex
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {badges.map((emoji, i) => (
          <div
            key={i}
            className="aspect-square rounded-lg flex items-center justify-center text-base"
            style={{
              background: i < 5 ? "rgba(255,92,0,0.15)" : "rgba(255,255,255,0.04)",
              border:
                i < 5 ? "1px solid rgba(255,92,0,0.3)" : "1px solid rgba(255,255,255,0.05)",
              filter: i >= 5 ? "grayscale(1) opacity(0.4)" : "none",
            }}
          >
            {emoji}
          </div>
        ))}
      </div>
      <div className="mt-2 bg-[#2A2A2A] rounded-full overflow-hidden h-1.5">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #FF5C00, #E9C349)" }}
          initial={{ width: 0 }}
          animate={{ width: "55%" }}
          transition={{ duration: 1.5, delay: 0.3 }}
        />
      </div>
      <div className="text-[6px] text-[#E4BEB1]/60 mt-1">5/9 badges collected</div>
    </div>
  );
}

function CheckinScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-2 p-3">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.3, 1] }}
        transition={{ duration: 0.5 }}
        className="w-12 h-12 rounded-full bg-[#FF5C00] flex items-center justify-center text-white text-xl font-bold shadow-[0_0_20px_rgba(255,92,0,0.6)]"
      >
        ✓
      </motion.div>
      <div
        className="text-[10px] text-[#E5E2E1] tracking-wider uppercase"
        style={{ fontFamily: "var(--font-bebas)" }}
      >
        Checked In!
      </div>
      <div className="text-[8px] text-[#E9C349] font-bold">+150 XP EARNED</div>
      <div className="text-[7px] text-[#E4BEB1]/60">The Raven • Fells Point</div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-[#FF5C00]/10 border border-[#FF5C00]/30 rounded-lg px-2 py-1 text-center"
      >
        <div className="text-[7px] text-[#FF5C00] font-bold">🦀 CRAB KING PROGRESS</div>
        <div className="text-[6px] text-[#E4BEB1]/60">3/10 seafood spots</div>
      </motion.div>
    </div>
  );
}

const SCREENS = [
  { id: "discover", content: <DiscoverScreen /> },
  { id: "map", content: <MapScreen /> },
  { id: "badges", content: <BadgesScreen /> },
  { id: "checkin", content: <CheckinScreen /> },
];

export function PhoneMockup({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [currentScreen, setCurrentScreen] = useState(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), {
    stiffness: 100,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), {
    stiffness: 100,
    damping: 20,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScreen((s) => (s + 1) % SCREENS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={`phone-float select-none ${className ?? ""}`}
      style={{ perspective: 1000, rotateX, rotateY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative w-[200px] h-[400px] rounded-[32px] bg-[#0E0E0E] border-2 border-[#2A2A2A] shadow-[0_0_60px_rgba(255,92,0,0.25),inset_0_0_20px_rgba(0,0,0,0.5)]">
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full bg-[#0E0E0E] border border-[#2A2A2A] z-20" />
        <div className="absolute inset-[3px] rounded-[30px] bg-[#131313] overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-5 pb-1">
            <span className="text-[7px] text-[#E5E2E1]/60">9:41</span>
            <span className="text-[7px] text-[#E5E2E1]/60">▲ 🔋</span>
          </div>
          <div className="flex items-center justify-between px-3 pb-2">
            <span
              className="text-[9px] text-[#FF5C00] tracking-widest uppercase"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              CCN
            </span>
            <div className="flex gap-1">
              {SCREENS.map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full transition-all duration-300"
                  style={{ background: i === currentScreen ? "#FF5C00" : "#2A2A2A" }}
                />
              ))}
            </div>
          </div>
          <div style={{ height: "calc(100% - 60px)" }}>
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {SCREENS[currentScreen].content}
            </motion.div>
          </div>
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-[#2A2A2A]" />
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-6 rounded-full bg-[#FF5C00]/20 blur-xl" />
      </div>
    </motion.div>
  );
}
