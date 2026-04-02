"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { ShineBorder } from "@/components/ui/shine-border";
import { Ripple } from "@/components/ui/ripple";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import type { WaitlistEntry } from "@/types";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
});
type FormData = z.infer<typeof schema>;

export function WaitlistForm() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [entry, setEntry] = useState<WaitlistEntry | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setState("loading");
    try {
      const crabsFound = parseInt(localStorage.getItem("ccn_crabs_found") ?? "0", 10);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/waitlist';
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, crabs_found: crabsFound }),
      });
      const result = (await res.json()) as WaitlistEntry & { alreadyJoined?: boolean; error?: string };
      if (res.status === 409 || result.alreadyJoined) {
        toast.info("You're already on the list! Check your inbox. 🦀");
        setState("idle");
        return;
      }
      if (!res.ok) throw new Error(result.error ?? "Failed");
      setEntry(result);
      setState("success");
      window.dispatchEvent(new CustomEvent("crab-party"));
      if (typeof window !== "undefined") {
        const confetti = (await import("canvas-confetti")).default;
        void confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ["#FF5C00", "#E9C349", "#FFB59A", "#FF3366"] });
      }
    } catch {
      setState("error");
      toast.error("Something went wrong. Please try again!");
    }
  }

  function copyReferralLink() {
    const url = `${window.location.origin}?ref=${entry?.position ?? ""}`;
    void navigator.clipboard.writeText(url);
    toast.success("Referral link copied! 🦀");
  }

  if (state === "success" && entry) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-2xl bg-[#1C1B1B] border border-[#FF5C00]/30 p-8 text-center overflow-hidden">
        <div className="relative z-10">
          <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} transition={{ duration: 0.5 }} className="text-5xl mb-4">✅</motion.div>
          <h3 className="text-4xl text-[#E5E2E1] mb-2" style={{ fontFamily: "var(--font-bebas)" }}>
            YOU&apos;RE #{entry.position} ON THE LIST! 🦀
          </h3>
          <p className="text-[#E4BEB1]/70 mb-6">We&apos;ll let you know when we launch</p>

          <div className="space-y-3 mb-6">
            {[
              { icon: "🦀", text: "3 Exclusive Early Adopter Badges unlocked" },
              { icon: "⚡", text: `${entry.bonusXP} Bonus XP on Launch Day` },
              { icon: "🎯", text: "Priority Access Before Everyone Else" },
            ].map((perk, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 bg-[#0E0E0E] rounded-xl px-4 py-3">
                <span className="text-xl">{perk.icon}</span>
                <span className="text-sm text-[#E5E2E1]">{perk.text}</span>
              </motion.div>
            ))}
          </div>

          <p className="text-sm text-[#E4BEB1]/60 mb-3">Move up the list by sharing:</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <InteractiveHoverButton text="Share on Instagram" className="text-sm" />
            <button onClick={copyReferralLink}
              className="px-4 py-2 rounded-full bg-[#2A2A2A] text-[#E5E2E1] text-sm font-bold hover:bg-[#353534] transition cursor-pointer border border-[#5B4137]/30">
              Copy Referral Link
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      <ShineBorder className="rounded-2xl" borderWidth={2} color={["#FF5C00", "#E9C349", "#FFB59A"]}>
        <div className="relative bg-[#1C1B1B] rounded-2xl p-6 md:p-8 overflow-hidden">
          <Ripple mainCircleSize={210} numCircles={5} className="opacity-20" />
          <div className="relative z-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="relative">
                <input
                  {...register("email")}
                  type="email"
                  placeholder="your@email.com"
                  disabled={state === "loading"}
                  className="w-full h-14 bg-[#0E0E0E] border border-[#5B4137]/30 rounded-xl px-5 text-[#E5E2E1] placeholder-[#E4BEB1]/30 text-base outline-none transition-all duration-300 focus:border-[#FF5C00]/60 focus:shadow-[0_0_0_3px_rgba(255,92,0,0.15)] disabled:opacity-50"
                />
                {errors.email && <p className="mt-1 text-sm text-[#FF3366]">{errors.email.message}</p>}
              </div>

              <RainbowButton type="submit" disabled={state === "loading"}
                className="w-full tracking-widest text-lg h-14 disabled:opacity-50 cursor-pointer"
                style={{ fontFamily: "var(--font-bebas)" }}>
                {state === "loading" ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    CLAIMING YOUR SPOT...
                  </span>
                ) : "CLAIM YOUR SPOT 🦀"}
              </RainbowButton>

              <p className="text-center text-xs text-[#E4BEB1]/40">
                No spam. Just your launch notification. Unsubscribe anytime.
              </p>
            </form>
          </div>
        </div>
      </ShineBorder>
    </div>
  );
}
