"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function BmoreTrigger() {
  const [input, setInput] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const next = (input + e.key.toUpperCase()).slice(-5);
      setInput(next);
      if (next === "BMORE") {
        setShow(true);
        setInput("");
        window.dispatchEvent(
          new CustomEvent("xp-gain", {
            detail: { amount: 100, x: window.innerWidth / 2, y: window.innerHeight / 2 },
          })
        );
        setTimeout(() => setShow(false), 3000);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [input]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9995] flex items-center justify-center pointer-events-none"
        >
          <div className="absolute inset-0 flex">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="flex-1"
                style={{ backgroundColor: i % 2 === 0 ? "#000" : "#E9C349", opacity: 0.88 }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.3, delay: i * 0.025 }}
              />
            ))}
          </div>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="relative z-10 text-center"
          >
            <div
              className="text-white tracking-widest drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]"
              style={{
                fontFamily: "var(--font-bebas)",
                fontSize: "clamp(4rem, 12vw, 8rem)",
              }}
            >
              BMORE PRIDE
            </div>
            <div
              className="text-[#E9C349] tracking-widest mt-2"
              style={{
                fontFamily: "var(--font-bebas)",
                fontSize: "clamp(1.5rem, 4vw, 2rem)",
              }}
            >
              🦀 +100 XP EARNED
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
