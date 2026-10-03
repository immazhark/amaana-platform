"use client";

import { useState } from "react";
import { DonationForm } from "@/components/donation-form";

export function DonationRemountFixture() {
  const [mounted, setMounted] = useState(true);

  return (
    <div>
      <div aria-label="Donation checkout remount controls" style={{ display: "flex", gap: ".75rem", marginBottom: "1rem" }}>
        <button type="button" onClick={() => setMounted(false)} disabled={!mounted}>
          Unmount donation form
        </button>
        <button type="button" onClick={() => setMounted(true)} disabled={mounted}>
          Remount donation form
        </button>
      </div>
      {mounted ? (
        <DonationForm
          appealId="browser-acceptance-appeal"
          appealTitle="Browser Acceptance Appeal"
          maxAmount={5000}
          zakatEligible
        />
      ) : (
        <p role="status">Donation form unmounted for remount acceptance.</p>
      )}
    </div>
  );
}
