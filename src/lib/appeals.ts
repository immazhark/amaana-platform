export type PublicAppeal = { slug: string; title: string; summary: string; category: string; location: string; goal: number; raised: number };

export const appeals: PublicAppeal[] = [
  { slug: "medical-care-support", title: "Urgent medical care support", summary: "Help a verified family meet essential treatment and recovery costs.", category: "Medical", location: "Hyderabad", goal: 250000, raised: 146500 },
  { slug: "education-continuity", title: "Keep a student in education", summary: "Support tuition and learning essentials for a promising student facing hardship.", category: "Education", location: "Telangana", goal: 85000, raised: 41000 },
  { slug: "livelihood-restart", title: "A dignified livelihood restart", summary: "Help a skilled worker purchase essential tools and return to independent earning.", category: "Livelihood", location: "Hyderabad", goal: 95000, raised: 72000 },
];

export const formatINR = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
