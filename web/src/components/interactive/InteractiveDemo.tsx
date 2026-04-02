"use client";
import { BlurFade } from "@/components/ui/blur-fade";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { CrowdMeterLive } from "./CrowdMeterLive";
import { BadgeScratcher } from "./BadgeScratcher";
import { BarCrawlBuilder } from "./BarCrawlBuilder";

export function InteractiveDemo() {
  return (
    <section id="demo" className="py-24 bg-[#0E0E0E] relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,92,0,0.5) 1px, transparent 0)", backgroundSize: "30px 30px" }} />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <BlurFade delay={0.1}>
            <AnimatedGradientText className="inline-block text-sm font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full border border-[#FF5C00]/20">
              Interactive Preview
            </AnimatedGradientText>
          </BlurFade>
          <BlurFade delay={0.2}>
            <h2 className="text-[#E5E2E1] tracking-wide mb-4" style={{ fontFamily: "var(--font-bebas)", fontSize: "clamp(2.5rem, 8vw, 5rem)" }}>
              TRY IT RIGHT NOW
            </h2>
          </BlurFade>
          <BlurFade delay={0.3}>
            <p className="text-[#E4BEB1]/70 text-lg max-w-xl mx-auto">
              Get a taste of Charm City Nights before you even download it
            </p>
          </BlurFade>
        </div>

        <div className="space-y-16">
          <BlurFade delay={0.1}>
            <div>
              <div className="text-center mb-6">
                <span className="text-[#FF5C00] tracking-widest text-lg uppercase" style={{ fontFamily: "var(--font-bebas)" }}>Demo 1</span>
                <h3 className="text-3xl text-[#E5E2E1] mt-1 uppercase" style={{ fontFamily: "var(--font-bebas)" }}>Live Crowd Meter</h3>
              </div>
              <div className="max-w-md mx-auto"><CrowdMeterLive /></div>
            </div>
          </BlurFade>

          <BlurFade delay={0.1}>
            <div>
              <div className="text-center mb-6">
                <span className="text-[#E9C349] tracking-widest text-lg uppercase" style={{ fontFamily: "var(--font-bebas)" }}>Demo 2</span>
                <h3 className="text-3xl text-[#E5E2E1] mt-1 uppercase" style={{ fontFamily: "var(--font-bebas)" }}>Badge Scratcher</h3>
              </div>
              <div className="max-w-sm mx-auto"><BadgeScratcher /></div>
            </div>
          </BlurFade>

          <BlurFade delay={0.1}>
            <div>
              <div className="text-center mb-6">
                <span className="text-[#00C9A7] tracking-widest text-lg uppercase" style={{ fontFamily: "var(--font-bebas)" }}>Demo 3</span>
                <h3 className="text-3xl text-[#E5E2E1] mt-1 uppercase" style={{ fontFamily: "var(--font-bebas)" }}>Bar Crawl Builder</h3>
              </div>
              <div className="max-w-lg mx-auto"><BarCrawlBuilder /></div>
            </div>
          </BlurFade>
        </div>
      </div>
    </section>
  );
}
