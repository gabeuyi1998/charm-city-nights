"use client";
import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BADGES = [
  { id: "crab-king", name: "Crab King", emoji: "🦀", lore: "True royalty of the Chesapeake", rarity: "legendary" as const },
  { id: "harbor-hawk", name: "Harbor Hawk", emoji: "🦅", lore: "Eyes on the whole harbor", rarity: "epic" as const },
  { id: "anchor-drop", name: "Anchor Drop", emoji: "⚓", lore: "Grounded in Baltimore", rarity: "rare" as const },
  { id: "night-owl", name: "Night Owl", emoji: "🦉", lore: "Creature of the night", rarity: "rare" as const },
  { id: "indie-spirit", name: "Indie Spirit", emoji: "🎸", lore: "The sound of the city", rarity: "rare" as const },
  { id: "fed-regular", name: "Fed Hill Regular", emoji: "🍺", lore: "South Baltimore staple", rarity: "common" as const },
];

const RARITY_COLORS = {
  legendary: "#E9C349",
  epic: "#7B2FBE",
  rare: "#3B82F6",
  common: "#6B7280",
} as const;

export function BadgeScratcher() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [scratching, setScratching] = useState(false);
  const [badge] = useState(() => BADGES[Math.floor(Math.random() * BADGES.length)]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#353534";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#E4BEB1";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Scratch here 👆", canvas.width / 2, canvas.height / 2 - 8);
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#AB897D";
    ctx.fillText("drag to reveal your badge", canvas.width / 2, canvas.height / 2 + 12);
  }, []);

  function scratch(x: number, y: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 128) transparent++;
    }
    if ((transparent / (data.length / 4)) * 100 > 50 && !revealed) setRevealed(true);
  }

  function getMousePos(e: React.MouseEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const c = e.currentTarget;
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  }

  function getTouchPos(e: React.TouchEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const c = e.currentTarget;
    const t = e.touches[0];
    return { x: (t.clientX - r.left) * (c.width / r.width), y: (t.clientY - r.top) * (c.height / r.height) };
  }

  const color = RARITY_COLORS[badge.rarity];

  return (
    <div className="rounded-2xl bg-[#1C1B1B] border border-[#5B4137]/20 p-6 text-center">
      <h3 className="text-2xl text-[#E5E2E1] tracking-wide mb-2 uppercase" style={{ fontFamily: "var(--font-bebas)" }}>
        Scratch to Reveal
      </h3>
      <p className="text-sm text-[#E4BEB1]/60 mb-4">Your first Baltimore badge awaits...</p>

      <div className="relative w-full max-w-[280px] mx-auto aspect-square rounded-xl overflow-hidden">
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-xl"
          style={{ background: `radial-gradient(circle, ${color}22 0%, #1C1B1B 100%)`, border: `1px solid ${color}40` }}
        >
          <motion.div className="text-6xl mb-2" animate={revealed ? { scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] } : {}}>
            {badge.emoji}
          </motion.div>
          <div className="text-xl uppercase" style={{ fontFamily: "var(--font-bebas)", color }}>{badge.name}</div>
          <div className="text-xs font-bold uppercase tracking-widest mt-1 px-2 py-0.5 rounded-full"
            style={{ background: `${color}22`, color, border: `1px solid ${color}40` }}>
            {badge.rarity}
          </div>
          {revealed && (
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-2 text-xs text-[#E4BEB1]/60 max-w-[180px] text-center px-2">
              {badge.lore}
            </motion.p>
          )}
        </div>

        <canvas
          ref={canvasRef}
          width={280}
          height={280}
          className={`absolute inset-0 w-full h-full rounded-xl transition-opacity duration-500 ${revealed ? "opacity-0 pointer-events-none" : "cursor-crosshair"}`}
          onMouseDown={() => setScratching(true)}
          onMouseUp={() => setScratching(false)}
          onMouseLeave={() => setScratching(false)}
          onMouseMove={(e) => { if (scratching) { const p = getMousePos(e); scratch(p.x, p.y); } }}
          onTouchStart={() => setScratching(true)}
          onTouchEnd={() => setScratching(false)}
          onTouchMove={(e) => { if (scratching) { const p = getTouchPos(e); scratch(p.x, p.y); } }}
        />
      </div>

      <AnimatePresence>
        {revealed && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
            <p className="text-sm text-[#E4BEB1]/70 mb-3">Join the waitlist to collect all 20 Baltimore badges →</p>
            <button
              onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
              className="bg-[#FF5C00] text-white px-6 py-2 rounded-full text-sm font-bold hover:bg-[#FF5C00]/90 transition cursor-pointer uppercase tracking-widest"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              Claim Your Spot
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
