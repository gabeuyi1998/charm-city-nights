"use client";
import dynamic from "next/dynamic";
import { Hero } from "@/components/sections/Hero";
import { LiveTicker } from "@/components/sections/LiveTicker";
import { Features } from "@/components/sections/Features";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { BadgeShowcase } from "@/components/sections/BadgeShowcase";
import { SocialProof } from "@/components/sections/SocialProof";
import { WaitlistSection } from "@/components/sections/WaitlistSection";
import { Footer } from "@/components/sections/Footer";
import { ScrollProgress } from "@/components/interactive/ScrollProgress";
import { EasterEggHunter } from "@/components/interactive/EasterEggHunter";
import { BmoreTrigger } from "@/components/interactive/BmoreTrigger";

const InteractiveDemo = dynamic(
  () => import("@/components/interactive/InteractiveDemo").then((m) => m.InteractiveDemo),
  { ssr: false }
);

const CursorTrail = dynamic(
  () => import("@/components/interactive/CursorTrail").then((m) => m.CursorTrail),
  { ssr: false }
);

export default function Home() {
  return (
    <>
      <ScrollProgress />
      <CursorTrail />
      <EasterEggHunter />
      <BmoreTrigger />
      <main>
        <Hero />
        <LiveTicker />
        <InteractiveDemo />
        <Features />
        <HowItWorks />
        <BadgeShowcase />
        <SocialProof />
        <WaitlistSection />
        <Footer />
      </main>
    </>
  );
}
