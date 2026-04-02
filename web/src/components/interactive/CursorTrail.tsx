"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface TrailPoint {
  id: number;
  x: number;
  y: number;
}

export function CursorTrail() {
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const isMobile = window.innerWidth < 768 || "ontouchstart" in window;
    if (!isMobile) setEnabled(true);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let lastTime = 0;

    function onMouseMove(e: MouseEvent) {
      const now = Date.now();
      if (now - lastTime < 80) return;
      lastTime = now;
      const id = now;
      setTrail((prev) => [...prev.slice(-6), { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setTrail((prev) => prev.filter((p) => p.id !== id));
      }, 800);
    }

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9989]">
      <AnimatePresence>
        {trail.map((point) => (
          <motion.div
            key={point.id}
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: 0, scale: 0.4, y: -10 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed text-xs pointer-events-none select-none"
            style={{ left: point.x - 8, top: point.y - 8 }}
          >
            🦀
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
