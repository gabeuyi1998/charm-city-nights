"use client";

import { useReducedMotion } from "framer-motion";
import { BlurFade } from "@/components/ui/blur-fade";
import { MagicCard } from "@/components/ui/magic-card";
import { HiddenCrab } from "@/components/interactive/HiddenCrab";

interface FeatureItem {
  title: string;
  description: string;
  icon: string;
  color: string;
}

const FEATURES: FeatureItem[] = [
  {
    title: "Live Crowd Intelligence",
    description: "Real-time crowd levels at every Baltimore bar. Know before you go.",
    icon: "🔥",
    color: "#FF5C00",
  },
  {
    title: "Badge Collection",
    description: "20+ unique Baltimore badges to hunt. From common to legendary.",
    icon: "🏅",
    color: "#E9C349",
  },
  {
    title: "Bar Crawl Routes",
    description: "Guided crawls through Baltimore's best neighborhoods.",
    icon: "🗺️",
    color: "#00C9A7",
  },
  {
    title: "Live Stories & Clips",
    description: "Real video from bars happening right now.",
    icon: "🎥",
    color: "#7B2FBE",
  },
  {
    title: "Flash Deals & Vouchers",
    description: "Unlock exclusive deals as you explore the city.",
    icon: "🎁",
    color: "#E9C349",
  },
  {
    title: "Find Your Crew",
    description: "See where your friends are in real time.",
    icon: "👥",
    color: "#FF3366",
  },
];

export function Features() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="features"
      className="relative py-24 px-6"
      style={{ background: "#131313" }}
    >
      {/* Heading area with subtle glow effect */}
      <div className="relative mb-16 text-center">
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,92,0,0.15) 0%, transparent 70%)",
          }}
        />
        <BlurFade delay={0} inView>
          <h2
            className="relative text-5xl md:text-7xl text-center text-[#E5E2E1] tracking-wider"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            EVERYTHING FOR THE PERFECT NIGHT
          </h2>
        </BlurFade>
        <BlurFade delay={0.1} inView>
          <p
            className="text-[#E4BEB1]/70 text-center text-lg mt-4"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            Baltimore&apos;s nightlife, now with cheat codes
          </p>
        </BlurFade>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {FEATURES.map((feature, i) => (
          <BlurFade
            key={feature.title}
            delay={shouldReduceMotion ? 0 : 0.05 * i}
            inView
          >
            <MagicCard
              className="h-full bg-[#1C1B1B] border-[#2A2A2A] p-6 cursor-default"
              gradientColor="#2A2A2A"
              gradientOpacity={0.6}
            >
              <div className="flex flex-col gap-3 p-2">
                <span
                  className="text-4xl"
                  role="img"
                  aria-label={feature.title}
                >
                  {feature.icon}
                </span>
                <h3
                  className="text-xl text-[#E5E2E1] tracking-wide"
                  style={{
                    fontFamily: "var(--font-bebas)",
                    color: feature.color,
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-[#E4BEB1]/70 text-sm leading-relaxed"
                  style={{ fontFamily: "var(--font-outfit)" }}
                >
                  {feature.description}
                </p>
              </div>
            </MagicCard>
          </BlurFade>
        ))}
      </div>

      <HiddenCrab
        position="features"
        className="absolute bottom-4 right-4 text-xs"
      />
    </section>
  );
}
