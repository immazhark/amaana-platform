/** Educational estimate only. All values are entered by the visitor;
 * no metal-price feed, storage, network request or tax/donation eligibility claim. */
export const ZAKAT_ASSET_KEYS = ["cash", "metals", "investments", "inventory", "receivables"] as const;
export type ZakatAssetKey = (typeof ZAKAT_ASSET_KEYS)[number];
export type ZakatEstimateInput = Record<ZakatAssetKey, string> & {
  liabilities: string;
  nisab: string;
  hawl: "yes" | "no" | "unsure";
};
export type ZakatEstimate = {
  status: "missing_nisab" | "invalid_input" | "below_nisab" | "hawl_unconfirmed" | "estimated";
  assetsPaise: bigint;
  liabilitiesPaise: bigint;
  netPaise: bigint;
  nisabPaise: bigint;
  zakatPaise: bigint;
};
const INR = /^(?:0|[1-9][0-9]{0,12})(?:\.[0-9]{1,2})?$/;
export function parseZakatAmount(value: string): bigint | null {
  const text = value.trim();
  if (!INR.test(text)) return null;
  const [rupees, fraction = ""] = text.split(".");
  return BigInt(rupees!) * 100n + BigInt(fraction.padEnd(2, "0"));
}
export function formatZakatPaise(paise: bigint): string {
  const neg = paise < 0n, abs = neg ? -paise : paise;
  return (neg ? "−" : "") + "₹" +
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(abs / 100n) +
    "." + (abs % 100n).toString().padStart(2, "0");
}
/** 2.5% of net monetary wealth when visitor-supplied nisab + hawl are met.
 * Debt eligibility, assets, school of jurisprudence and threshold require review. */
export function calculateZakatEstimate(input: ZakatEstimateInput): ZakatEstimate {
  const empty = (status: ZakatEstimate["status"]): ZakatEstimate =>
    ({ status, assetsPaise: 0n, liabilitiesPaise: 0n, netPaise: 0n,
      nisabPaise: 0n, zakatPaise: 0n });
  if (!input.nisab.trim()) return empty("missing_nisab");
  const nisab = parseZakatAmount(input.nisab);
  if (nisab === null || nisab <= 0n) return empty("invalid_input");
  const assets = ZAKAT_ASSET_KEYS.map(k => parseZakatAmount(input[k].trim() || "0"));
  const liabilities = parseZakatAmount(input.liabilities.trim() || "0");
  if (assets.some(v => v === null) || liabilities === null ||
      !["yes", "no", "unsure"].includes(input.hawl)) return empty("invalid_input");
  const assetsPaise = (assets as bigint[]).reduce((sum, v) => sum + v, 0n);
  const netPaise = assetsPaise > liabilities ? assetsPaise - liabilities : 0n;
  const status: ZakatEstimate["status"] = netPaise < nisab
    ? "below_nisab" : input.hawl === "yes" ? "estimated" : "hawl_unconfirmed";
  return { status, assetsPaise, liabilitiesPaise: liabilities,
    netPaise, nisabPaise: nisab,
    zakatPaise: status === "estimated" ? (netPaise + 20n) / 40n : 0n };
}
