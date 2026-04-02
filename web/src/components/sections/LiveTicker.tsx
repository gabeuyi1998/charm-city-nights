"use client";
import { useReducedMotion } from "framer-motion";
import { VelocityScroll } from "@/components/ui/scroll-based-velocity";

const ROW_ONE =
  "🔥 Federal Hill PACKED · 94%  •  🦀 Crab King badge unlocked  •  ⚡ Free cover at Power Plant  •  🏅 Harbor Hustle crawl done  •  🎵 Live music at Cat's Eye 9pm  •";

const ROW_TWO =
  "📍 247 check-ins tonight  •  🎁 Flash Deal: free shot  •  🦅 Harbor Hawk unlocked  •  🍺 $4 drafts all night  •  👥 32 on the crawl  •";

export function LiveTicker() {
  const shouldReduceMotion = useReducedMotion();
  const velocity = shouldReduceMotion ? 0 : 5;

  return (
    <section id="ticker" className="overflow-hidden py-8 border-t-2 border-[#FF5C00] bg-[#0E0E0E]">
      <VelocityScroll
        text={ROW_ONE}
        default_velocity={velocity}
        className="text-[#E5E2E1] text-lg tracking-wider font-display"
      />
      <div className="mt-2" style={{ transform: "scaleX(-1)" }}>
        <VelocityScroll
          text={ROW_TWO}
          default_velocity={velocity}
          className="text-[#E9C349] text-lg tracking-wider font-display"
        />
      </div>
    </section>
  );
}
