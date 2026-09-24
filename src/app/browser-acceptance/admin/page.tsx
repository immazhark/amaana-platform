import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { adminHomePathForPermissions } from "@/lib/admin-navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Browser Acceptance Fixture",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type Profile = {
  label: string;
  roles: string[];
  permissions: string[];
};

const profiles: Record<string, Profile> = {
  case: {
    label: "Case reviewer",
    roles: ["CASE_REVIEWER"],
    permissions: ["assistance.view", "assistance.update", "assistance.assign", "assistance.approve"],
  },
  editorial: {
    label: "Editorial reviewer",
    roles: ["CONTENT_REVIEWER"],
    permissions: ["appeal.view", "appeal.create", "appeal.update", "appeal.publish", "content.view", "content.publish"],
  },
  finance: {
    label: "Donation reviewer",
    roles: ["DONATION_REVIEWER"],
    permissions: ["donation.view"],
  },
  full: {
    label: "Operations administrator",
    roles: ["OPERATIONS_ADMIN"],
    permissions: [
      "assistance.view", "assistance.update", "assistance.assign", "assistance.approve",
      "appeal.view", "appeal.create", "appeal.update", "appeal.publish",
      "content.view", "content.publish", "donation.view", "notification.view",
    ],
  },
  none: {
    label: "No operational permissions",
    roles: ["RESTRICTED_STAFF"],
    permissions: [],
  },
};

type Props = { searchParams: Promise<{ profile?: string }> };

export default async function AdminBrowserAcceptanceFixture({ searchParams }: Props) {
  if (process.env.AMAANA_BROWSER_ACCEPTANCE !== "true") notFound();
  const { profile: requestedProfile } = await searchParams;
  const profileKey = requestedProfile && requestedProfile in profiles ? requestedProfile : "full";
  const profile = profiles[profileKey];
  const homePath = adminHomePathForPermissions(profile.permissions);

  return (
    <AdminShell
      userName="Synthetic Admin"
      roleNames={profile.roles}
      permissions={profile.permissions}
      fixtureLabel="Synthetic acceptance session — no shared records"
    >
      <section className="section" aria-labelledby="admin-acceptance-heading">
        <div className="admin-heading">
          <div>
            <p className="eyebrow">Browser acceptance fixture</p>
            <h1 id="admin-acceptance-heading">Synthetic operations console</h1>
          </div>
        </div>
        <div className="card">
          <p><strong>Profile:</strong> {profile.label}</p>
          <p><strong>Fail-closed landing:</strong> <code>{homePath}</code></p>
          <p>This fixture validates admin navigation and authorization presentation without querying or mutating donor, beneficiary, payment, media, or retention records.</p>
        </div>
        <div className="card-grid">
          <article className="card"><h2>Assistance review</h2><p>Verification, assignment and approval controls remain permission-gated in server actions.</p></article>
          <article className="card"><h2>Publication review</h2><p>Appeal and media publication remain separate operational permissions.</p></article>
          <article className="card"><h2>Donation review</h2><p>Financial records are read only in this synthetic browser fixture.</p></article>
        </div>
      </section>
    </AdminShell>
  );
}
