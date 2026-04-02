"use client";

import { useReducedMotion, motion } from "framer-motion";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { BorderBeam } from "@/components/ui/border-beam";
import { WordRotate } from "@/components/ui/word-rotate";

interface Step {
  number: string;
  icon: string;
  verbs: string[];
  suffix: string;
  body: string;
}

const STEPS: Step[] = [
  {
    number: "01",
    icon: "📱",
    verbs: ["Download", "Install", "Join", "Open"],
    suffix: " & Sign Up",
    body: "Log in with Facebook, Apple, or Google in under 30 seconds.",
  },
  {
    number: "02",
    icon: "🗺️",
    verbs: ["Discover", "Explore", "Find"],
    suffix: " Tonight",
    body: "See live crowd levels, friend locations and hot spots across Baltimore.",
  },
  {
    number: "03",
    icon: "🔥",
    verbs: ["Check In", "Collect", "Earn", "Win"],
    suffix: " Badges",
    body: "Check in at bars to collect badges, earn XP and unlock exclusive deals.",
  },
];

export function HowItWorks() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      id="how-it-works"
      className="py-24 px-6"
      style={{ background: "#0E0E0E" }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className="text-5xl md:text-7xl text-[#E5E2E1] tracking-wider"
            style={{ fontFamily: "var(--font-bebas)" }}
          >
            HOW IT WORKS
          </h2>
        </div>

        <TracingBeam className="px-4">
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                initial={
                  shouldReduceMotion
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 40 }
                }
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: shouldReduceMotion ? 0 : i * 0.15,
                  ease: "easeOut",
                }}
                className="relative overflow-hidden rounded-2xl p-8"
                style={{ background: "#1C1B1B" }}
              >
                {/* Decorative step number */}
                <span
                  className="absolute top-2 right-4 text-[120px] leading-none opacity-5 select-none pointer-events-none"
                  aria-hidden="true"
                  style={{ fontFamily: "var(--font-bebas)" }}
                >
                  {step.number}
                </span>

                {/* BorderBeam decoration */}
                <BorderBeam
                  size={180}
                  duration={10}
                  delay={i * 1.5}
                  colorFrom="#FF5C00"
                  colorTo="#E9C349"
                />

                <div className="relative z-10 flex flex-col gap-4">
                  <span className="text-4xl" role="img" aria-label={`Step ${step.number}`}>
                    {step.icon}
                  </span>

                  <div
                    className="flex items-center gap-0 text-2xl text-[#E5E2E1] tracking-wide leading-tight"
                    style={{ fontFamily: "var(--font-bebas)" }}
                  >
                    {/* WordRotate renders an h1 — reset it visually */}
                    <span className="inline-flex items-center">
                      <span
                        style={{
                          display: "inline-block",
                          overflow: "hidden",
                          height: "2.2rem",
                        }}
                      >
                        <WordRotate
                          words={step.verbs}
                          duration={2500}
                          className="text-[#FF5C00] text-2xl m-0 p-0 font-[inherit] leading-none tracking-wider"
                          framerProps={{
                            initial: { opacity: 0, y: -20 },
                            animate: { opacity: 1, y: 0 },
                            exit: { opacity: 0, y: 20 },
                            transition: { duration: 0.25, ease: "easeOut" },
                          }}
                        />
                      </span>
                      <span className="text-[#E5E2E1]">{step.suffix}</span>
                    </span>
                  </div>

                  <p
                    className="text-[#E4BEB1]/70 text-sm leading-relaxed"
                    style={{ fontFamily: "var(--font-outfit)" }}
                  >
                    {step.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </TracingBeam>
      </div>
    </section>
  );
}
