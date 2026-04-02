import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  crabs_found: z.number().min(0).max(4).default(0),
});

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const { email, crabs_found } = parsed.data;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      // Dev mode: return mock data
      return NextResponse.json({
        success: true,
        email,
        position: Math.floor(Math.random() * 487) + 1,
        bonusXP: 500 + crabs_found * 50,
        crabsFound: crabs_found,
      });
    }

    const { supabaseAdmin } = await import("@/lib/supabase");

    const { data: existing } = await supabaseAdmin
      .from("waitlist")
      .select("position")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        email,
        position: (existing as { position: number }).position,
        bonusXP: 500 + crabs_found * 50,
        crabsFound: crabs_found,
        alreadyJoined: true,
      });
    }

    const { data, error } = await supabaseAdmin
      .from("waitlist")
      .insert({ email, crabs_found, source: "website" })
      .select("position")
      .single();

    if (error) throw error;

    const position = (data as { position: number }).position;
    const bonusXP = 500 + crabs_found * 50;

    if (process.env.RESEND_API_KEY) {
      const { resend, FROM_EMAIL, APP_URL } = await import("@/lib/resend");
      void resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: `You're #${position} on the Charm City Nights waitlist 🦀`,
        html: buildEmail({ position, bonusXP, crabsFound: crabs_found, appUrl: APP_URL }),
      });
    }

    return NextResponse.json({ success: true, email, position, bonusXP, crabsFound: crabs_found });
  } catch (err) {
    console.error("Waitlist error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function buildEmail({ position, bonusXP, crabsFound, appUrl }: {
  position: number; bonusXP: number; crabsFound: number; appUrl: string;
}) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="background:#131313;color:#E5E2E1;font-family:Arial,sans-serif;margin:0;padding:0;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="font-size:48px;margin-bottom:8px;">🦀</div>
      <h1 style="color:#FF5C00;font-size:28px;letter-spacing:0.15em;margin:0;">CHARM CITY NIGHTS</h1>
    </div>
    <h2 style="color:#E5E2E1;font-size:24px;text-align:center;">
      You're <span style="color:#FF5C00;">#${position}</span> on the list!
    </h2>
    <div style="background:#1C1B1B;border:1px solid rgba(255,92,0,0.2);border-radius:16px;padding:24px;margin:24px 0;">
      <p style="color:#E4BEB1;margin:0 0 16px;">As an early member you've unlocked:</p>
      <div>🦀 3 Exclusive Early Adopter Badges</div>
      <div>⚡ <strong style="color:#E9C349;">${bonusXP} Bonus XP</strong> on Launch Day</div>
      <div>🎯 Priority Access Before Everyone Else</div>
    </div>
    ${crabsFound > 0 ? `<div style="background:rgba(255,92,0,0.1);border:1px solid rgba(255,92,0,0.3);border-radius:12px;padding:16px;margin:16px 0;text-align:center;">
      <p style="margin:0;color:#FF5C00;">🦀 x${crabsFound} You found ${crabsFound} hidden crab${crabsFound > 1 ? "s" : ""} on our website!</p>
      <p style="margin:4px 0 0;color:#E4BEB1;font-size:14px;">That&apos;s ${crabsFound * 50} extra XP saved for launch day.</p>
    </div>` : ""}
    <p style="color:#E4BEB1;text-align:center;">We launch Summer 2026 in Baltimore. You'll be the first to know.</p>
    <div style="text-align:center;margin:24px 0;">
      <a href="${appUrl}" style="background:#FF5C00;color:white;padding:12px 32px;border-radius:999px;text-decoration:none;font-weight:bold;">SHARE YOUR SPOT</a>
    </div>
    <p style="text-align:center;color:#E4BEB1;font-size:12px;opacity:0.5;">Made with ❤️ in Baltimore</p>
  </div>
</body></html>`;
}
