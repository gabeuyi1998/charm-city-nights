"use client";
import { motion } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { PhoneMockup } from "@/components/ui/PhoneMockup";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Meteors } from "@/components/ui/meteors";
import { Spotlight } from "@/components/ui/spotlight";
import { FlipWords } from "@/components/ui/flip-words";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { Button } from "@/components/ui/moving-border";
import { AnimatedTooltip } from "@/components/ui/animated-tooltip";
import { NumberTicker } from "@/components/ui/number-ticker";

const WAITLIST_AVATARS = [
  {
    id: 1,
    name: "Marcus T.",
    designation: "Fells Point regular",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=marcus",
  },
  {
    id: 2,
    name: "Brianna K.",
    designation: "Canton crawl queen",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=brianna",
  },
  {
    id: 3,
    name: "Devon W.",
    designation: "Fed Hill local",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=devon",
  },
  {
    id: 4,
    name: "Aaliyah M.",
    designation: "Bar crawl legend",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=aaliyah",
  },
  {
    id: 5,
    name: "Josh R.",
    designation: "Inner Harbor vibes",
    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=josh",
  },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function Hero() {
  return (
    <>
      <Navbar />

      <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0E0E0E]">
        {/* Background layers */}
        <BackgroundBeams className="opacity-40" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Meteors number={20} />
        </div>
        <Spotlight
          className="-top-40 left-1/2 -translate-x-1/2 md:-top-20"
          fill="#FF5C00"
        />

        {/* Radial vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 100%, transparent 0%, #0E0E0E 70%)",
          }}
        />

        {/* Main content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-28 pb-20">
          <div className="flex flex-col md:flex-row items-center gap-12 md:gap-8">
            {/* Left column */}
            <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left gap-6">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center rounded-full border border-[#FF5C00]/30 bg-[#FF5C00]/10 px-4 py-1.5"
              >
                <AnimatedShinyText className="text-xs tracking-widest uppercase text-[#FF5C00]">
                  🔴 Launching Summer 2026 in Baltimore
                </AnimatedShinyText>
              </motion.div>

              {/* Headline */}
              <div
                className="text-6xl md:text-8xl leading-none tracking-tight uppercase"
                style={{ fontFamily: "var(--font-bebas)" }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  style={{
                    backgroundImage: "linear-gradient(135deg, #FF5C00, #E9C349)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Baltimore&apos;s
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="text-[#E5E2E1]"
                >
                  Nightlife
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="text-[#E5E2E1]"
                >
                  Is About To
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="text-[#FF5C00] flex items-center"
                >
                  <FlipWords
                    words={["CHANGE", "LEVEL UP", "GO WILD", "BEGIN"]}
                    duration={2500}
                    className="text-[#FF5C00] px-0"
                  />
                </motion.div>
              </div>

              {/* Subheadline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.65 }}
                className="max-w-md"
              >
                <TextGenerateEffect
                  words="Discover where the crowd is going. Collect badges. Conquer bar crawls."
                  className="text-[#E4BEB1]/80 font-normal text-base md:text-lg"
                  duration={0.4}
                />
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="flex flex-wrap gap-4 items-center justify-center md:justify-start"
              >
                <motion.button
                  onClick={() => scrollTo("waitlist")}
                  className="rounded-full bg-[#FF5C00] text-white px-8 py-3.5 cursor-pointer tracking-[0.12em] uppercase text-base shadow-[0_0_20px_rgba(255,92,0,0.4)] hover:shadow-[0_0_30px_rgba(255,92,0,0.6)] transition-shadow"
                  style={{ fontFamily: "var(--font-bebas)" }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Join the Waitlist
                </motion.button>

                <Button
                  onClick={() => scrollTo("demo")}
                  containerClassName="h-12 w-44"
                  borderClassName="bg-[radial-gradient(#FF5C00_40%,transparent_60%)]"
                  className="text-[#E5E2E1] text-sm tracking-[0.12em] uppercase cursor-pointer"
                  style={{ fontFamily: "var(--font-bebas)" }}
                  duration={3000}
                >
                  See the App ↓
                </Button>
              </motion.div>

              {/* Social proof */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                className="flex flex-col sm:flex-row items-center gap-4 pt-2"
              >
                <AnimatedTooltip items={WAITLIST_AVATARS} />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-[#FF5C00]" style={{ fontFamily: "var(--font-bebas)" }}>
                    <NumberTicker value={2847} className="text-[#FF5C00]" />
                  </span>
                  <span className="text-sm text-[#E4BEB1]/60">on the waitlist</span>
                </div>
              </motion.div>
            </div>

            {/* Right column — phone */}
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.4, type: "spring", stiffness: 80 }}
              className="flex-shrink-0 flex justify-center"
            >
              <PhoneMockup />
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
