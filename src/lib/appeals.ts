export type PublicAppeal = { slug: string; title: string; summary: string; category: string; beneficiaryLocation: string | null; goalAmount: { toNumber(): number } | number; amountRaised: { toNumber(): number } | number };

export const formatINR = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
