"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type CrabPos = "hero" | "features" | "badges" | "footer";

interface XPToast {
  id: number;
  amount: number;
  x: number;
  y: number;
}

const CRAB_MESSAGES: Record<CrabPos, string> = {
  hero: "Hero crab found! 🦀 +50 XP saved for launch day",
  features: "Features crab! 🦀 +50 XP saved for launch day",
  badges: "Badge crab found! 🦀 +50 XP saved for launch day",
  footer: "Footer crab! Find all 4 to unlock 🏆 Crab Hunter badge",
};

export function EasterEggHunter() {
  const [xpTotal, setXpTotal] = useState(0);
  const [xpToasts, setXpToasts] = useState<XPToast[]>([]);
  const [showXPBadge, setShowXPBadge] = useState(false);
  const [crabsFound, setCrabsFound] = useState<Set<CrabPos>>(new Set());
  const [showCrabParty, setShowCrabParty] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("ccn_xp");
    const storedCrabs = localStorage.getItem("ccn_crabs_found");
    if (stored) {
      setXpTotal(parseInt(stored, 10));
      setShowXPBadge(true);
    }
    if (storedCrabs && parseInt(storedCrabs, 10) > 0) setShowXPBadge(true);
  }, []);

  useEffect(() => {
    function handleCrabFound(e: Event) {
      const ev = e as CustomEvent<{ position: CrabPos }>;
      const pos = ev.detail.position;
      setCrabsFound((prev) => {
        if (prev.has(pos)) return prev;
        const next = new Set(prev).add(pos);
        setXpTotal((xp) => {
          const newXP = xp + 50;
          localStorage.setItem("ccn_xp", String(newXP));
          return newXP;
        });
        localStorage.setItem("ccn_crabs_found", String(next.size));
        setShowXPBadge(true);
        toast.success(CRAB_MESSAGES[pos], { duration: 4000, icon: "🦀" });
        if (next.size === 4) {
          setTimeout(() => {
            toast.success(
              "🏆 CRAB HUNTER! All 4 crabs found! +200 bonus XP on launch day!",
              { duration: 6000 }
            );
          }, 600);
        }
        return next;
      });
    }
    window.addEventListener("crab-found", handleCrabFound);
    return () => window.removeEventListener("crab-found", handleCrabFound);
  }, []);

  useEffect(() => {
    function handleXPGain(e: Event) {
      const ev = e as CustomEvent<{ amount: number; x: number; y: number }>;
      const { amount, x, y } = ev.detail;
      const id = Date.now();
      setXpToasts((prev) => [...prev, { id, amount, x, y }]);
      setTimeout(() => setXpToasts((prev) => prev.filter((t) => t.id !== id)), 1200);
      setXpTotal((prev) => {
        const n = prev + amount;
        localStorage.setItem("ccn_xp", String(n));
        return n;
      });
      setShowXPBadge(true);
    }
    window.addEventListener("xp-gain", handleXPGain);
    return () => window.removeEventListener("xp-gain", handleXPGain);
  }, []);

  useEffect(() => {
    function handleCrabParty() {
      setShowCrabParty(true);
      setTimeout(() => setShowCrabParty(false), 3500);
    }
    window.addEventListener("crab-party", handleCrabParty);
    return () => window.removeEventListener("crab-party", handleCrabParty);
  }, []);

  return (
    <>
      <AnimatePresence>
        {showXPBadge && (
          <motion.div
            initial={{ opacity: 0, x: -20, y: 20 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            className="fixed bottom-6 left-4 z-[9990] bg-[#1C1B1B] border border-[#FF5C00]/30 rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,92,0,0.2)] select-none"
          >
            <span className="text-sm">⚡</span>
            <motion.span
              key={xpTotal}
              initial={{ scale: 1.3, color: "#FF5C00" }}
              animate={{ scale: 1, color: "#E9C349" }}
              className="text-base tracking-wide"
              style={{ fontFamily: "var(--font-bebas)" }}
            >
              {xpTotal} XP
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {xpToasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -60, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="fixed z-[9991] pointer-events-none text-[#E9C349] text-lg"
            style={{ top: t.y, left: t.x, fontFamily: "var(--font-bebas)" }}
          >
            +{t.amount} XP
          </motion.div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {showCrabParty && (
          <div className="fixed inset-0 pointer-events-none z-[9992] overflow-hidden">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="absolute text-3xl select-none"
                initial={{ x: -60, y: `${15 + i * 16}%` }}
                animate={{ x: "calc(100vw + 60px)" }}
                transition={{ duration: 2, delay: i * 0.2, ease: "linear" }}
              >
                🦀
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
