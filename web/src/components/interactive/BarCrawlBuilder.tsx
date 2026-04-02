"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Hood { id: string; name: string; barCount: number; xpPerBar: number; }

const NEIGHBORHOODS: Hood[] = [
  { id: "fells-point", name: "Fells Point", barCount: 18, xpPerBar: 25 },
  { id: "federal-hill", name: "Federal Hill", barCount: 14, xpPerBar: 25 },
  { id: "canton", name: "Canton", barCount: 12, xpPerBar: 25 },
  { id: "inner-harbor", name: "Inner Harbor", barCount: 10, xpPerBar: 30 },
  { id: "mount-vernon", name: "Mount Vernon", barCount: 8, xpPerBar: 35 },
  { id: "hampden", name: "Hampden", barCount: 9, xpPerBar: 30 },
];

const DOT_POS: Record<string, { x: number; y: number }> = {
  "fells-point": { x: 70, y: 60 }, "federal-hill": { x: 35, y: 75 },
  canton: { x: 80, y: 40 }, "inner-harbor": { x: 50, y: 65 },
  "mount-vernon": { x: 45, y: 30 }, hampden: { x: 30, y: 20 },
};

export function BarCrawlBuilder() {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (id: string) => setSelected((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const totalBars = selected.reduce((a, id) => a + (NEIGHBORHOODS.find((n) => n.id === id)?.barCount ?? 0), 0);
  const totalXP = selected.reduce((a, id) => { const n = NEIGHBORHOODS.find((h) => h.id === id); return a + (n ? n.barCount * n.xpPerBar : 0); }, 0);

  return (
    <div className="rounded-2xl bg-[#1C1B1B] border border-[#5B4137]/20 p-6">
      <h3 className="text-2xl text-[#E5E2E1] tracking-wide mb-1 uppercase" style={{ fontFamily: "var(--font-bebas)" }}>
        Build Your Bar Crawl
      </h3>
      <p className="text-sm text-[#E4BEB1]/60 mb-4">Select neighborhoods to create your perfect night</p>

      <div className="flex flex-wrap gap-2 mb-5">
        {NEIGHBORHOODS.map((hood) => {
          const sel = selected.includes(hood.id);
          return (
            <motion.button key={hood.id} onClick={() => toggle(hood.id)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className={cn("px-4 py-2 rounded-full text-sm font-bold tracking-wide transition-all duration-200 cursor-pointer",
                sel ? "bg-[#FF5C00] text-white shadow-[0_0_15px_rgba(255,92,0,0.4)]" : "bg-[#2A2A2A] text-[#E4BEB1]/70 hover:bg-[#353534]")}>
              {hood.name} <span className="opacity-60 text-xs ml-1">{hood.barCount}</span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="flex gap-3 mb-4">
              {[{ val: selected.length, label: "Neighborhoods", color: "#FF5C00" }, { val: totalBars, label: "Bars", color: "#E9C349" }, { val: totalXP, label: "Max XP", color: "#E9C349" }].map(({ val, label, color }) => (
                <div key={label} className="flex-1 bg-[#0E0E0E] rounded-xl p-3 text-center">
                  <motion.div key={val} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-2xl" style={{ fontFamily: "var(--font-bebas)", color }}>{val}</motion.div>
                  <div className="text-xs text-[#E4BEB1]/60">{label}</div>
                </div>
              ))}
            </div>

            <div className="h-2 bg-[#2A2A2A] rounded-full overflow-hidden mb-4">
              <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, #FF5C00, #E9C349)" }} animate={{ width: `${(selected.length / 6) * 100}%` }} transition={{ duration: 0.4 }} />
            </div>

            {selected.length >= 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative h-20 bg-[#0E0E0E] rounded-xl overflow-hidden mb-4">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "linear-gradient(rgba(255,92,0,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,92,0,0.5) 1px, transparent 1px)", backgroundSize: "15px 15px" }} />
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  {selected.slice(0, -1).map((id, i) => {
                    const p1 = DOT_POS[id] ?? { x: 50, y: 50 };
                    const p2 = DOT_POS[selected[i + 1]] ?? { x: 50, y: 50 };
                    return <line key={`${id}-${selected[i + 1]}`} x1={`${p1.x}%`} y1={`${p1.y}%`} x2={`${p2.x}%`} y2={`${p2.y}%`} stroke="#FF5C00" strokeWidth="1" strokeDasharray="4 2" strokeOpacity="0.5" />;
                  })}
                </svg>
                {selected.map((id) => {
                  const pos = DOT_POS[id] ?? { x: 50, y: 50 };
                  return <motion.div key={id} initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute w-3 h-3 rounded-full bg-[#FF5C00] -translate-x-1/2 -translate-y-1/2" style={{ left: `${pos.x}%`, top: `${pos.y}%`, boxShadow: "0 0 8px rgba(255,92,0,0.6)" }} />;
                })}
              </motion.div>
            )}

            {selected.length >= 3 && (
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })}
                className="w-full bg-[#FF5C00] text-white py-3 rounded-full text-lg hover:bg-[#FF5C00]/90 transition cursor-pointer uppercase tracking-widest"
                style={{ fontFamily: "var(--font-bebas)" }}>
                Start This Crawl → {totalXP} XP
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {selected.length === 0 && <p className="text-center text-[#E4BEB1]/40 text-sm py-4">Select at least 3 neighborhoods to build your crawl</p>}
    </div>
  );
}
