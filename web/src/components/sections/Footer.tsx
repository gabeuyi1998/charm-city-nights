"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { BorderBeam } from "@/components/ui/border-beam";
import { toast } from "sonner";

export function Footer() {
  const [crabClicked, setCrabClicked] = useState(false);

  function handleCrabClick() {
    if (crabClicked) return;
    setCrabClicked(true);
    window.dispatchEvent(new CustomEvent("crab-found", { detail: { position: "footer" } }));
    toast.success("🦀 Footer crab found! +50 XP saved for launch day!", { duration: 4000 });
  }

  return (
    <footer id="footer" className="relative bg-[#0E0E0E] pt-16 pb-8 px-6">
      <BorderBeam
        className="absolute top-0 left-0 right-0 h-px"
        size={300}
        duration={8}
        colorFrom="#FF5C00"
        colorTo="#E9C349"
      />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center text-center mb-12">
          <button
            onClick={handleCrabClick}
            className="text-5xl mb-4 cursor-pointer bg-transparent border-0 p-0 select-none hover:scale-110 transition-transform"
            aria-label="Find the hidden crab"
          >
            <motion.span
              animate={crabClicked ? { rotate: [0, -20, 20, -15, 15, 0], scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.6 }}
              className="inline-block"
            >
              🦀
            </motion.span>
          </button>
          <h2
            className="text-3xl text-[#FF5C00] tracking-[0.15em] mb-2 uppercase"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            Charm City Nights
          </h2>
          <p className="text-[#E4BEB1]/60 text-sm mb-1">Baltimore&apos;s nightlife, gamified</p>
          <p className="text-[#E4BEB1]/40 text-xs">Launching Summer 2026</p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
          {["Features", "How It Works", "Badges", "Privacy", "Terms"].map((link) => (
            <a
              key={link}
              href="#"
              className="text-[#E4BEB1]/50 hover:text-[#FF5C00] transition-colors duration-200"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              {link}
            </a>
          ))}
        </div>

        <div className="flex justify-center gap-4 mb-8">
          {/* Instagram */}
          <a
            href="#"
            aria-label="Instagram"
            className="w-10 h-10 rounded-full bg-[#1C1B1B] border border-[#5B4137]/20 flex items-center justify-center text-[#E4BEB1]/50 hover:text-[#FF5C00] hover:border-[#FF5C00]/30 transition-all duration-200 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </a>
          {/* TikTok */}
          <a
            href="#"
            aria-label="TikTok"
            className="w-10 h-10 rounded-full bg-[#1C1B1B] border border-[#5B4137]/20 flex items-center justify-center text-[#E4BEB1]/50 hover:text-[#FF5C00] hover:border-[#FF5C00]/30 transition-all duration-200 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z" />
            </svg>
          </a>
          {/* X/Twitter */}
          <a
            href="#"
            aria-label="X"
            className="w-10 h-10 rounded-full bg-[#1C1B1B] border border-[#5B4137]/20 flex items-center justify-center text-[#E4BEB1]/50 hover:text-[#FF5C00] hover:border-[#FF5C00]/30 transition-all duration-200 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>

        <div className="text-center text-[#E4BEB1]/30 text-xs" style={{ fontFamily: "var(--font-outfit)" }}>
          © 2026 Charm City Nights • Made with ❤️ in Baltimore
        </div>
      </div>
    </footer>
  );
}
