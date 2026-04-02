"use client";

import { BlurFade } from "@/components/ui/blur-fade";
import { NumberTicker } from "@/components/ui/number-ticker";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";

interface Stat {
  value: number;
  label: string;
  suffix: string;
}

const STATS: Stat[] = [
  { value: 2847, label: "waitlist members", suffix: "+" },
  { value: 20, label: "partner bars", suffix: "+" },
  { value: 35, label: "crawl routes", suffix: "+" },
  { value: 500, label: "early spots", suffix: "" },
];

const TESTIMONIALS = [
  {
    quote: "Finally an app FOR Baltimore. This is exactly what Fed Hill needed.",
    name: "@jessb_bmore",
    title: "Federal Hill",
  },
  {
    quote: "The bar crawl feature is absolutely insane. We hit 8 bars in one night.",
    name: "@crab_bro",
    title: "Canton",
  },
  {
    quote: "Found 4 badges in one night 🔥 the badge hunt is addicting",
    name: "@nightcrawler99",
    title: "Fells Point",
  },
  {
    quote: "My whole crew uses it every weekend. It changed how we do nights out.",
    name: "@fedhill_vibes",
    title: "Federal Hill",
  },
  {
    quote: "Best thing to happen to Baltimore nightlife. Period.",
    name: "@bmore_local",
    title: "Hampden",
  },
];

const TOOLTIP_USERS = [
  {
    id: 1,
    name: "Jessica B.",
    designation: "Federal Hill regular",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica",
  },
  {
    id: 2,
    name: "CrabBro",
    designation: "Canton local",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=CrabBro",
  },
  {
    id: 3,
    name: "NightCrawler99",
    designation: "Fells Point explorer",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=NightCrawler99",
  },
  {
    id: 4,
    name: "FedHill Vibes",
    designation: "South Baltimore crew",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=FedHillVibes",
  },
  {
    id: 5,
    name: "Bmore Local",
    designation: "Hampden native",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=BmoreLocal",
  },
];

export function SocialProof() {
  return (
    <section
      id="social-proof"
      className="py-24 px-6 overflow-hidden"
      style={{ background: "#0E0E0E" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Stats row */}
        <BlurFade delay={0} inView>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {STATS.map((stat, i) => (
              <BlurFade key={stat.label} delay={0.07 * i} inView>
                <div className="text-center">
                  <div
                    className="text-4xl md:text-5xl text-[#FF5C00] leading-none"
                    style={{ fontFamily: "var(--font-bebas)", letterSpacing: "0.05em" }}
                  >
                    <NumberTicker
                      value={stat.value}
                      delay={0.2 * i}
                      className="text-[#FF5C00] text-4xl md:text-5xl tabular-nums"
                    />
                    <span>{stat.suffix}</span>
                  </div>
                  <p
                    className="text-[#E4BEB1]/60 text-sm mt-2 uppercase tracking-widest"
                    style={{ fontFamily: "var(--font-outfit)" }}
                  >
                    {stat.label}
                  </p>
                </div>
              </BlurFade>
            ))}
          </div>
        </BlurFade>

        {/* Section heading */}
        <BlurFade delay={0.1} inView>
          <h2
            className="text-4xl md:text-6xl text-center text-[#E5E2E1] tracking-wider mb-12"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            WHAT THE CITY IS SAYING
          </h2>
        </BlurFade>

        {/* Testimonials carousel */}
        <BlurFade delay={0.15} inView>
          <InfiniteMovingCards
            items={TESTIMONIALS}
            direction="left"
            speed="slow"
            pauseOnHover
            className="mb-16"
          />
        </BlurFade>

        {/* Animated tooltip users */}
        <BlurFade delay={0.2} inView>
          <div className="flex flex-col items-center gap-4">
            <AnimatedTooltip items={TOOLTIP_USERS} />
            <p
              className="text-[#E4BEB1]/50 text-sm"
              style={{ fontFamily: "var(--font-outfit)" }}
            >
              Join {STATS[0].value}+ on the waitlist
            </p>
          </div>
        </BlurFade>
      </div>
    </section>
  );
}
