"use client";

import { useEffect } from "react";

export const REFERRAL_STORAGE_KEY = "myresolvecenter_referral";

export function ReferralTracker() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("ref")?.trim().toUpperCase();
    if (code && /^[A-Z0-9_-]{3,32}$/.test(code)) window.localStorage.setItem(REFERRAL_STORAGE_KEY, code);
  }, []);
  return null;
}
