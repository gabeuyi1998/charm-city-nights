"use client";

import { useState } from "react";
import { useReducedMotion } from "framer-motion";
import { BlurFade } from "@/components/ui/blur-fade";
import { HiddenCrab } from "@/components/interactive/HiddenCrab";

type Rarity = "common" | "rare" | "epic" | "legendary";

interface Badge {
  id: string;
  name: string;
  emoji: string;
  lore: string;
  rarity: Rarity;
  xpValue: number;
}

const CCN_BADGES: Badge[] = [
  { id: "crab-king", name: "Crab King", emoji: "🦀", lore: "True royalty of the Chesapeake", rarity: "legendary", xpValue: 500 },
  { id: "power-surge", name: "Power Surge", emoji: "⚡", lore: "Electric nights at the Point", rarity: "legendary", xpValue: 450 },
  { id: "legend", name: "Legend", emoji: "🏆", lore: "Baltimore bows to you", rarity: "legendary", xpValue: 1000 },
  { id: "harbor-hawk", name: "Harbor Hawk", emoji: "🦅", lore: "Eyes on the whole harbor", rarity: "epic", xpValue: 300 },
  { id: "night-king", name: "Night King", emoji: "👑", lore: "The night is yours", rarity: "epic", xpValue: 250 },
  { id: "anchor-drop", name: "Anchor Drop", emoji: "⚓", lore: "Grounded in Baltimore", rarity: "rare", xpValue: 150 },
  { id: "night-owl", name: "Night Owl", emoji: "🦉", lore: "Creature of the night", rarity: "rare", xpValue: 150 },
  { id: "indie-spirit", name: "Indie Spirit", emoji: "🎸", lore: "The sound of the city", rarity: "rare", xpValue: 150 },
  { id: "fed-regular", name: "Fed Hill Regular", emoji: "🍺", lore: "South Baltimore staple", rarity: "common", xpValue: 75 },
  { id: "canton-crawler", name: "Canton Crawler", emoji: "🚶", lore: "O'Donnell Square legend", rarity: "common", xpValue: 75 },
  { id: "fells-pilgrim", name: "Fells Pilgrim", emoji: "🗺️", lore: "Cobblestone wanderer", rarity: "common", xpValue: 75 },
  { id: "mystery-1", name: "???", emoji: "❓", lore: "Explore to unlock", rarity: "epic", xpValue: 0 },
  { id: "mystery-2", name: "???", emoji: "❓", lore: "Explore to unlock", rarity: "rare", xpValue: 0 },
];

const RARITY_COLORS: Record<Rarity, string> = {
  legendary: "#E9C349",
  epic: "#7B2FBE",
  rare: "#3B82F6",
  common: "#6B7280",
};

const RARITY_GLOW: Record<Rarity, string> = {
  legendary: "rgba(233,195,73,0.35)",
  epic: "rgba(123,47,190,0.35)",
  rare: "rgba(59,130,246,0.35)",
  common: "rgba(107,114,128,0.2)",
};

interface BadgeCardProps {
  badge: Badge;
  shouldReduceMotion: boolean | null;
}

function BadgeCard({ badge, shouldReduceMotion }: BadgeCardProps) {
  const [flipped, setFlipped] = useState(false);
  const rarityColor = RARITY_COLORS[badge.rarity];
  const glowColor = RARITY_GLOW[badge.rarity];

  return (
    <button
      className="relative w-full aspect-square cursor-pointer bg-transparent border-0 p-0 select-none"
      style={{ perspective: "800px" }}
      onClick={() => setFlipped((f) => !f)}
      aria-label={`${badge.name} badge — click to flip`}
    >
      <div
        className="relative w-full h-full transition-transform"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped && !shouldReduceMotion ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: shouldReduceMotion ? "none" : "transform 0.5s ease",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-2 p-4"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            background: "#1C1B1B",
            border: `1px solid ${rarityColor}40`,
            boxShadow: `0 0 18px ${glowColor}`,
          }}
        >
          <span className="text-4xl leading-none" role="img" aria-label={badge.name}>
            {badge.emoji}
          </span>
          <span
            className="text-sm text-center leading-tight"
            style={{ fontFamily: "var(--font-bebas)", color: rarityColor, letterSpacing: "0.08em" }}
          >
            {badge.name}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full uppercase tracking-widest"
            style={{
              fontFamily: "var(--font-outfit)",
              background: `${rarityColor}22`,
              color: rarityColor,
              border: `1px solid ${rarityColor}55`,
              fontSize: "0.6rem",
            }}
          >
            {badge.rarity}
          </span>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-3 p-4"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "#2A2A2A",
            border: `1px solid ${rarityColor}60`,
            boxShadow: `0 0 22px ${glowColor}`,
          }}
        >
          <p
            className="text-center text-xs leading-snug text-[#E4BEB1]/80"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            {badge.lore}
          </p>
          {badge.xpValue > 0 && (
            <span
              className="text-sm font-bold"
              style={{ fontFamily: "var(--font-bebas)", color: "#E9C349", letterSpacing: "0.1em" }}
            >
              +{badge.xpValue} XP
            </span>
          )}
          {badge.xpValue === 0 && (
            <span
              className="text-xs"
              style={{ fontFamily: "var(--font-outfit)", color: "#6B7280" }}
            >
              Locked
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function BadgeShowcase() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="badges"
      className="relative py-24 px-6"
      style={{ background: "#131313" }}
    >
      {/* Subtle background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(233,195,73,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-5xl mx-auto relative">
        <BlurFade delay={0} inView>
          <h2
            className="text-5xl md:text-7xl text-center text-[#E5E2E1] tracking-wider mb-4"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            COLLECT THEM ALL
          </h2>
        </BlurFade>

        <BlurFade delay={0.08} inView>
          <p
            className="text-center text-[#E4BEB1]/60 mb-12"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            Tap a badge to flip it
          </p>
        </BlurFade>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {CCN_BADGES.map((badge, i) => (
            <BlurFade
              key={badge.id}
              delay={shouldReduceMotion ? 0 : 0.04 * i}
              inView
            >
              <BadgeCard badge={badge} shouldReduceMotion={shouldReduceMotion} />
            </BlurFade>
          ))}
        </div>
      </div>

      <HiddenCrab
        position="badges"
        className="absolute top-4 right-4 text-xs opacity-10 hover:opacity-100"
      />
    </section>
  );
}
