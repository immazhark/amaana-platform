import { isIntentAllowedForFund, zakatNoticeForFund, type FundZakatPolicyId } from "@/lib/giving-funds";
import type { OrderDestination } from "@/lib/donation-order";

type FundRow = { id: string; slug: string; name: string; zakatPolicy: FundZakatPolicyId; isGeneral: boolean };
type FundClient = { fund: { findFirst(args: { where: { slug: string; status: "ACTIVE" }; select: { id: true; slug: true; name: true; zakatPolicy: true; isGeneral: true } }): Promise<FundRow | null> } };

export type FundDestinationResult =
  | { ok: true; value: Extract<OrderDestination, { fundId: string }> }
  | { ok: false; status: 400 | 409; error: string };

// Resolves a donor's chosen fund on the server. Only ACTIVE funds accept gifts, Zakat is refused wherever the
// fund is not ruled ACCEPTED, and a free-text request is kept only for the General fund (staff confirm it).
export async function resolveFundDestination(
  client: FundClient,
  input: { fundSlug: string; givingIntent: string; donorDirective?: string | undefined },
): Promise<FundDestinationResult> {
  const fund = await client.fund.findFirst({
    where: { slug: input.fundSlug, status: "ACTIVE" },
    select: { id: true, slug: true, name: true, zakatPolicy: true, isGeneral: true },
  });
  if (!fund) return { ok: false, status: 409, error: "This fund is not accepting donations." };
  if (!isIntentAllowedForFund(fund.zakatPolicy, input.givingIntent)) {
    return { ok: false, status: 409, error: zakatNoticeForFund(fund.zakatPolicy) ?? "This donation type is not available for this fund." };
  }
  const directive = input.donorDirective?.trim() || null;
  if (directive && !fund.isGeneral) return { ok: false, status: 400, error: "A custom request can only be added to the General Fund." };
  return { ok: true, value: { fundId: fund.id, fundSlug: fund.slug, title: fund.name, donorDirective: directive } };
}
