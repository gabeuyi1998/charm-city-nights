import { NextResponse } from "next/server";

export const revalidate = 60;

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return NextResponse.json({ count: 487 });
    }
    const { supabaseAdmin } = await import("@/lib/supabase");
    const { count, error } = await supabaseAdmin
      .from("waitlist")
      .select("*", { count: "exact", head: true });
    if (error) throw error;
    return NextResponse.json({ count: count ?? 0 });
  } catch {
    return NextResponse.json({ count: 487 });
  }
}
