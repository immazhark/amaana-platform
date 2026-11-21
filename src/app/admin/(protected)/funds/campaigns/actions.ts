"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { parseCreateCampaign } from "@/lib/fund-campaign";
import { CampaignAdminError, createCampaign, updateCampaign } from "@/lib/fund-campaign-service";

const CAMPAIGNS_PATH = "/admin/funds/campaigns";

// One value per field; repeated or non-text fields are rejected rather than guessed at.
function field(formData: FormData, name: string): string | undefined {
  const values = formData.getAll(name);
  if (values.length > 1) throw new Error(`Repeated ${name} fields are not accepted.`);
  const value = values[0];
  if (value !== undefined && typeof value !== "string") throw new Error(`Use a single text ${name} field.`);
  return value;
}

const FIELDS = ["title", "unitLabel", "unitLabelPlural", "unitPrice", "maxUnits", "opensAt", "closesAt", "status", "note"] as const;
const collect = (formData: FormData, names: readonly string[]) => Object.fromEntries(names.map(name => [name, field(formData, name)]));

async function finish(work: () => Promise<string>): Promise<never> {
  let message: string;
  try {
    message = await work();
  } catch (error) {
    if (!(error instanceof CampaignAdminError)) throw error;
    message = error.message;
  }
  revalidatePath(CAMPAIGNS_PATH);
  revalidatePath("/give");
  redirect(`${CAMPAIGNS_PATH}?notice=${encodeURIComponent(message)}`);
}

export async function createCampaignAction(formData: FormData) {
  const user = await requirePermission("donation.reconcile");
  const parsed = parseCreateCampaign(collect(formData, ["slug", "fundId", ...FIELDS]));
  await finish(async () => {
    if (!parsed.ok) throw new CampaignAdminError(parsed.error);
    await createCampaign(parsed.value, user.id);
    return "Campaign saved.";
  });
}

export async function updateCampaignAction(formData: FormData) {
  const user = await requirePermission("donation.reconcile");
  const id = field(formData, "id");
  await finish(async () => {
    if (typeof id !== "string" || !/^[A-Za-z0-9_-]{3,64}$/.test(id)) throw new CampaignAdminError("Invalid campaign.");
    await updateCampaign(id, collect(formData, FIELDS), user.id);
    return "Campaign updated.";
  });
}
