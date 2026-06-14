import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateReferralCode } from "@/lib/buddy-pass";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function authenticatedUserId(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return data.user?.id ?? null;
}

async function ensureReferralCode(userId: string, currentCode?: string | null) {
  if (currentCode) return currentCode;

  const referralCode = generateReferralCode(userId);
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ referral_code: referralCode })
    .eq("id", userId);

  if (error) throw error;
  return referralCode;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await authenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, referral_code, buddy_pass_weeks_available, buddy_pass_weeks_earned, buddy_pass_weeks_used, buddy_pass_active_until")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const referralCode = await ensureReferralCode(userId, profile.referral_code);

    const { data: referrals } = await supabaseAdmin
      .from("buddy_pass_referrals")
      .select("id, referred_user_id, created_at, reward_weeks, discount_percent, status")
      .eq("referrer_id", userId)
      .eq("status", "rewarded")
      .order("created_at", { ascending: false })
      .limit(8);

    const { count: referralCount } = await supabaseAdmin
      .from("buddy_pass_referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", userId)
      .eq("status", "rewarded");

    const referredIds = [...new Set((referrals ?? [])
      .map((referral) => referral.referred_user_id)
      .filter(Boolean))] as string[];

    let emailsById = new Map<string, string>();
    if (referredIds.length > 0) {
      const { data: referredProfiles } = await supabaseAdmin
        .from("profiles")
        .select("id, email")
        .in("id", referredIds);

      emailsById = new Map(
        (referredProfiles ?? []).map((referredProfile) => [
          referredProfile.id,
          referredProfile.email,
        ])
      );
    }

    const origin = req.nextUrl.origin || "https://www.researchmatch.site";
    const activeUntil = profile.buddy_pass_active_until;
    const active = activeUntil ? new Date(activeUntil).getTime() > Date.now() : false;

    return NextResponse.json({
      referralCode,
      referralUrl: `${origin}/app?buddy=${encodeURIComponent(referralCode)}`,
      weeksAvailable: profile.buddy_pass_weeks_available ?? 0,
      weeksEarned: profile.buddy_pass_weeks_earned ?? 0,
      weeksUsed: profile.buddy_pass_weeks_used ?? 0,
      activeUntil,
      active,
      successfulReferrals: referralCount ?? referrals?.length ?? 0,
      referrals: (referrals ?? []).map((referral) => ({
        id: referral.id,
        friendEmail: referral.referred_user_id
          ? emailsById.get(referral.referred_user_id) ?? "Friend"
          : "Friend",
        createdAt: referral.created_at,
        rewardWeeks: referral.reward_weeks,
        discountPercent: referral.discount_percent,
      })),
    });
  } catch (err) {
    console.error("buddy pass GET error:", err);
    return NextResponse.json({ error: "Could not load Buddy Pass." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await authenticatedUserId(req);
    if (!userId) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const { action } = await req.json();
    if (action !== "activate") {
      return NextResponse.json({ error: "Invalid Buddy Pass action." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc("activate_buddy_pass_week", {
      p_user_id: userId,
    });

    if (error) {
      const message = error.message?.toLowerCase().includes("no buddy pass")
        ? "No Buddy Pass weeks available."
        : "Could not activate Buddy Pass.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const activatedWeek = Array.isArray(data) ? data[0] : null;
    return NextResponse.json({
      activeUntil: activatedWeek?.active_until ?? null,
      weeksAvailable: activatedWeek?.weeks_available ?? 0,
      activated: true,
    });
  } catch (err) {
    console.error("buddy pass POST error:", err);
    return NextResponse.json({ error: "Could not update Buddy Pass." }, { status: 500 });
  }
}
