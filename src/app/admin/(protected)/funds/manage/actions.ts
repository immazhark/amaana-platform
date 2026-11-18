"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { parseCreateFund, validFundId } from "@/lib/fund-admin";
import { FundAdminError, createFund, updateFund } from "@/lib/fund-admin-service";

const MANAGE_PATH = "/admin/funds/manage";

// One value per field; repeated or non-text fields are rejected rather than guessed at.
function field(formData: FormData, name: string): string | undefined {
  const values = formData.getAll(name);
  if (values.length > 1) throw new Error(`Repeated ${name} fields are not accepted.`);
  const value = values[0];
  if (value !== undefined && typeof value !== "string") throw new Error(`Use a single text ${name} field.`);
  return value;
}

const FIELDS = ["name", "summary", "zakatPolicy", "status", "sortOrder", "zakatBasis"] as const;
const collect = (formData: FormData, names: readonly string[]) => Object.fromEntries(names.map(name => [name, field(formData, name)]));

async function finish(work: () => Promise<string>): Promise<never> {
  let message: string;
  try {
    message = await work();
  } catch (error) {
    if (!(error instanceof FundAdminError)) throw error;
    message = error.message;
  }
  revalidatePath(MANAGE_PATH);
  revalidatePath("/admin/funds");
  revalidatePath("/give");
  revalidatePath("/funds");
  redirect(`${MANAGE_PATH}?notice=${encodeURIComponent(message)}`);
}

export async function createFundAction(formData: FormData) {
  const user = await requirePermission("donation.reconcile");
  const parsed = parseCreateFund(collect(formData, ["slug", ...FIELDS]));
  await finish(async () => {
    if (!parsed.ok) throw new FundAdminError(parsed.error);
    await createFund(parsed.value, user.id);
    return "Fund created. Set it to Active when it is ready to receive gifts.";
  });
}

export async function updateFundAction(formData: FormData) {
  const user = await requirePermission("donation.reconcile");
  const id = field(formData, "id");
  await finish(async () => {
    if (!validFundId(id)) throw new FundAdminError("Invalid fund.");
    await updateFund(id, collect(formData, FIELDS), user.id);
    return "Fund updated.";
  });
}
