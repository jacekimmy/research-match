"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { formatBuddyPassDate, hasActiveBuddyPass, hasPaidAccess, planLabelFor } from "@/lib/buddy-pass";
import styles from "./profile.module.css";

type BuddyReferral = {
  id: string;
  friendEmail: string;
  createdAt: string;
  rewardWeeks: number;
  discountPercent: number;
};

type BuddyPassData = {
  referralCode: string;
  referralUrl: string;
  weeksAvailable: number;
  weeksEarned: number;
  weeksUsed: number;
  activeUntil: string | null;
  active: boolean;
  successfulReferrals: number;
  referrals: BuddyReferral[];
};

const EMPTY_BUDDY_PASS: BuddyPassData = {
  referralCode: "",
  referralUrl: "",
  weeksAvailable: 0,
  weeksEarned: 0,
  weeksUsed: 0,
  activeUntil: null,
  active: false,
  successfulReferrals: 0,
  referrals: [],
};

function formatMemberSince(date?: string) {
  if (!date) return "Recently";
  return new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function daysSince(date?: string) {
  if (!date) return 1;
  const created = new Date(date).getTime();
  return Math.max(1, Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24)));
}

function resetDate(date?: string | null) {
  if (!date) return "soon";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [savedCount, setSavedCount] = useState(0);
  const [buddyPass, setBuddyPass] = useState<BuddyPassData>(EMPTY_BUDDY_PASS);
  const [buddyLoading, setBuddyLoading] = useState(true);
  const [buddyError, setBuddyError] = useState("");
  const [activationLoading, setActivationLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "code" | "link">("idle");

  const isPaid = hasPaidAccess(profile);
  const buddyActive = buddyPass.active || hasActiveBuddyPass(profile);
  const planLabel = planLabelFor(profile);
  const initial = user?.email?.charAt(0).toUpperCase() || "?";
  const summariesUsed = profile?.summaries_used ?? 0;
  const summariesLeft = isPaid ? "Unlimited" : `${Math.max(0, 1 - summariesUsed)} / 1`;

  const memberSince = useMemo(() => formatMemberSince(profile?.created_at), [profile?.created_at]);
  const activeDays = useMemo(() => daysSince(profile?.created_at), [profile?.created_at]);

  const fetchBuddyPass = useCallback(async () => {
    if (!user) return;
    setBuddyError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Missing auth session");

      const res = await fetch("/api/buddy-pass", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load Buddy Pass.");
      setBuddyPass(data);
    } catch (err) {
      setBuddyError(err instanceof Error ? err.message : "Could not load Buddy Pass.");
    } finally {
      setBuddyLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setSavedCount(JSON.parse(localStorage.getItem("research-match-saved") || "[]").length);
    refreshProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return;
    fetchBuddyPass();
    const interval = window.setInterval(fetchBuddyPass, 15000);
    return () => window.clearInterval(interval);
  }, [fetchBuddyPass, user]);

  async function copyBuddyPass(value: string, kind: "code" | "link") {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopyState(kind);
    window.setTimeout(() => setCopyState("idle"), 1600);
  }

  async function activateBuddyWeek() {
    if (buddyActive) return;
    if (buddyPass.weeksAvailable <= 0) {
      setBuddyError("You do not have a Buddy Week ready yet.");
      return;
    }

    setActivationLoading(true);
    setBuddyError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Missing auth session");

      const res = await fetch("/api/buddy-pass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: "activate" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not activate Buddy Pass.");

      await Promise.all([fetchBuddyPass(), refreshProfile()]);
    } catch (err) {
      setBuddyError(err instanceof Error ? err.message : "Could not activate Buddy Pass.");
    } finally {
      setActivationLoading(false);
    }
  }

  async function startSemesterCheckout() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert("Please sign in again to continue.");
        return;
      }

      const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_SEMESTER || "price_1TIuAlFINW44xCyFcxqgQpeV";
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || "Could not open checkout.");
    } catch {
      alert("Something went wrong. Please try again.");
    }
  }

  async function openBillingPortal() {
    setPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert("Please sign in again to manage billing.");
        return;
      }
      const res = await fetch("/api/customer-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || "Could not open billing portal. Please contact support.");
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  }

  async function cancelSubscription() {
    const confirmed = window.confirm("Cancel your Research Match subscription? You will not be charged again.");
    if (!confirmed) return;

    setCancelLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert("Please sign in again to cancel your subscription.");
        return;
      }
      const res = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Could not cancel subscription. Please contact support.");
        return;
      }
      await refreshProfile();
      alert("Subscription canceled. You will not be charged again.");
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  }

  if (!user) {
    return (
      <main className={`${styles.profileMount} profile-page`}>
        <section className="profile-signed-out profile-panel">
          <div className="profile-lock-mark">RM</div>
          <h1>Sign in to view your profile</h1>
          <p>Your plan, saved professors, and Buddy Pass rewards live here.</p>
          <Link href="/app" className="profile-primary-action">Go to app</Link>
        </section>
      </main>
    );
  }

  return (
    <main className={`${styles.profileMount} profile-page`}>
      <div className="profile-ambient profile-ambient-a" />
      <div className="profile-ambient profile-ambient-b" />

      <div className="profile-shell">
        <nav className="profile-topbar" aria-label="Profile navigation">
          <Link href="/app" className="profile-back-link">
            <span aria-hidden="true">←</span>
            Back to search
          </Link>
          <Link href="/" className="profile-brand-link">Research Match</Link>
        </nav>

        <section className="profile-hero-panel">
          <div className="profile-identity">
            <div className="profile-avatar-large">{initial}</div>
            <div>
              <p className="profile-kicker">Account</p>
              <h1>Profile Settings</h1>
              <p className="profile-email-label">{user.email}</p>
              <p className="profile-since-label">Member since {memberSince}</p>
            </div>
          </div>

          <div className="profile-plan-chip">
            <span className={isPaid ? "profile-plan-dot is-live" : "profile-plan-dot"} />
            <div>
              <p>Current access</p>
              <strong>{planLabel}</strong>
            </div>
          </div>
        </section>

        <section className="profile-metrics-grid" aria-label="Profile stats">
          <div className="profile-metric-card">
            <span>Summaries</span>
            <strong>{summariesLeft}</strong>
            <p>{isPaid ? "No limit while active" : `Resets ${resetDate(profile?.summaries_reset_at)}`}</p>
          </div>
          <div className="profile-metric-card">
            <span>Saved</span>
            <strong>{savedCount}</strong>
            <p>Professors in your shortlist</p>
          </div>
          <div className="profile-metric-card">
            <span>Days active</span>
            <strong>{activeDays}</strong>
            <p>Since you joined</p>
          </div>
          <div className="profile-metric-card">
            <span>Buddy weeks</span>
            <strong>{buddyLoading ? "..." : buddyPass.weeksAvailable}</strong>
            <p>{buddyActive ? `Active until ${formatBuddyPassDate(buddyPass.activeUntil || profile?.buddy_pass_active_until)}` : "Ready to activate"}</p>
          </div>
        </section>

        <section className="profile-content-grid">
          <div className="profile-main-stack">
            <section className="profile-panel buddy-pass-panel">
              <div className="profile-panel-header">
                <div>
                  <p className="profile-kicker">Research Buddy Pass</p>
                  <h2>Give 25% off. Bank a free week.</h2>
                </div>
                <span className="buddy-pass-badge">Stackable</span>
              </div>

              <p className="profile-muted">
                Share your code — friends get 25% off any plan. You earn one free week per successful referral. Weeks stack and never expire.
              </p>

              <div className="buddy-share-card">
                <div className="buddy-share-row">
                  <div>
                    <span className="buddy-share-label">Referral code</span>
                    <strong className="buddy-share-code">
                      {buddyLoading ? "Loading…" : buddyPass.referralCode}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyBuddyPass(buddyPass.referralCode, "code")}
                    className="profile-soft-button"
                  >
                    {copyState === "code" ? "✓ Copied" : "Copy code"}
                  </button>
                </div>
                <hr className="buddy-share-sep" aria-hidden="true" />
                <div className="buddy-share-row">
                  <span className="buddy-share-url">
                    {buddyPass.referralUrl || "Loading share link…"}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyBuddyPass(buddyPass.referralUrl, "link")}
                    className="profile-soft-button"
                  >
                    {copyState === "link" ? "✓ Copied" : "Copy link"}
                  </button>
                </div>
              </div>

              <div className="buddy-activation-card">
                <div>
                  <p className="profile-kicker">Week usage</p>
                  <h3>{buddyActive ? "Buddy Week is running" : "Activate one stored week"}</h3>
                  <p>
                    {buddyActive
                      ? `This week stays on until ${formatBuddyPassDate(buddyPass.activeUntil || profile?.buddy_pass_active_until)}. It cannot be paused once started.`
                      : buddyPass.weeksAvailable > 0
                        ? "Turn it on when you need a focused research sprint."
                        : "Refer a friend to earn your next free week."}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={buddyActive}
                  aria-label={buddyActive ? "Buddy Week is active" : "Activate one Buddy Week"}
                  disabled={activationLoading || buddyActive || buddyPass.weeksAvailable <= 0}
                  onClick={activateBuddyWeek}
                  className={`buddy-toggle${buddyActive ? " is-on" : ""}`}
                  title={buddyActive ? "Buddy Weeks cannot be paused once started." : "Start one stored Buddy Week."}
                >
                  <span />
                </button>
              </div>

              {buddyError && <p className="profile-error">{buddyError}</p>}

              <div className="buddy-pass-stats">
                <div>
                  <strong>{buddyPass.successfulReferrals}</strong>
                  <span>referrals</span>
                </div>
                <div>
                  <strong>{buddyPass.weeksEarned}</strong>
                  <span>earned</span>
                </div>
                <div>
                  <strong>{buddyPass.weeksUsed}</strong>
                  <span>used</span>
                </div>
              </div>
            </section>

            <section className="profile-panel">
              <div className="profile-panel-header">
                <div>
                  <p className="profile-kicker">Access</p>
                  <h2>Your plan includes</h2>
                </div>
              </div>

              <div className="profile-feature-list">
                {[
                  ["Full research summaries", true],
                  ["Suggested questions", true],
                  ["Author position labels", true],
                  ["Save professors", true],
                  ["Paper links", true],
                  ["Unlimited summaries", isPaid],
                  ["Email checker", isPaid],
                  ["Professor email finder", isPaid],
                  ["Nearby professor access", isPaid],
                ].map(([feature, included]) => (
                  <div key={feature as string} className={included ? "profile-feature-row" : "profile-feature-row is-muted"}>
                    <span>{included ? "✓" : "·"}</span>
                    <p>{feature}</p>
                  </div>
                ))}
              </div>

              {!isPaid && profile?.plan_type !== "lifetime" && (
                <button type="button" onClick={startSemesterCheckout} className="profile-primary-action profile-full-action">
                  Get Semester Access
                </button>
              )}
            </section>
          </div>

          <aside className="profile-side-stack">
            <section className="profile-panel">
              <div className="profile-panel-header">
                <div>
                  <p className="profile-kicker">Referrals</p>
                  <h2>Recent rewards</h2>
                </div>
              </div>

              <div className="buddy-referral-list">
                {buddyPass.referrals.length > 0 ? buddyPass.referrals.map((referral) => (
                  <div className="buddy-referral-row" key={referral.id}>
                    <div>
                      <strong>{referral.friendEmail}</strong>
                      <p>{formatBuddyPassDate(referral.createdAt)}</p>
                    </div>
                    <span>+{referral.rewardWeeks} week</span>
                  </div>
                )) : (
                  <div className="buddy-empty-state">
                    <strong>No referrals yet</strong>
                    <p>Share your code and the first reward will land here automatically after checkout.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="profile-panel profile-actions-panel">
              <div className="profile-panel-header">
                <div>
                  <p className="profile-kicker">Account</p>
                  <h2>Settings</h2>
                </div>
              </div>

              <Link href="/feedback" className="profile-action-button">
                Give feedback
                <span className="profile-action-arrow" aria-hidden="true">→</span>
              </Link>

              {profile?.plan_type !== "lifetime" && (
                <button
                  id="manage-subscription-btn"
                  type="button"
                  disabled={portalLoading}
                  onClick={openBillingPortal}
                  className="profile-action-button"
                >
                  {portalLoading ? "Opening…" : "Manage subscription"}
                  {!portalLoading && <span className="profile-action-arrow" aria-hidden="true">→</span>}
                </button>
              )}

              {profile?.plan_type !== "lifetime" && (
                <button
                  id="cancel-subscription-btn"
                  type="button"
                  disabled={cancelLoading}
                  onClick={cancelSubscription}
                  className="profile-action-button is-danger"
                >
                  {cancelLoading ? "Canceling…" : "Cancel subscription"}
                  {!cancelLoading && <span className="profile-action-arrow" aria-hidden="true">→</span>}
                </button>
              )}

              <button
                type="button"
                onClick={async () => { await signOut(); window.location.href = "/"; }}
                className="profile-action-button is-danger"
              >
                Sign out
                <span className="profile-action-arrow" aria-hidden="true">→</span>
              </button>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
