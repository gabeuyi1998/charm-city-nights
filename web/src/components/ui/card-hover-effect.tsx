"use client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

interface HoverItem {
  title: string;
  description: string;
  link?: string;
  icon?: React.ReactNode;
  color?: string;
}

export function HoverEffect({
  items,
  className,
}: {
  items: HoverItem[];
  className?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 py-10", className)}>
      {items.map((item, idx) => (
        <div
          key={idx}
          className="relative group block p-2 h-full w-full cursor-pointer"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-[#FF5C00]/10 block rounded-2xl"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.15 } }}
                exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.2 } }}
              />
            )}
          </AnimatePresence>
          <div className={cn(
            "rounded-2xl h-full w-full p-6 overflow-hidden bg-[#1C1B1B] border border-[#5B4137]/20 relative z-20",
            "group-hover:border-[#FF5C00]/30 group-hover:shadow-[0_0_20px_rgba(255,92,0,0.15)] transition-all duration-300"
          )}>
            <div className="relative z-50 h-full">
              <div className="flex items-center gap-3 mb-3">
                {item.icon && (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{
                      backgroundColor: `${item.color ?? '#FF5C00'}20`,
                      border: `1px solid ${item.color ?? '#FF5C00'}40`,
                    }}
                  >
                    {item.icon}
                  </div>
                )}
                <h4 className="text-[#E5E2E1] font-bold tracking-wide text-base">{item.title}</h4>
              </div>
              <p className="text-[#E4BEB1]/70 tracking-wide leading-relaxed text-sm">{item.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
