export type EidKitsYearRecord = {
  year: number;
  families: number;
  donations?: string;
  kitCost?: string;
  detailedExpenditure?: string;
  notes?: string;
};

export type EidKitsBreakdownRecord = {
  label: string;
  count: number;
  share: string;
};

export type EidKitsEvidence = {
  history: EidKitsYearRecord[];
  breakdown2026: EidKitsBreakdownRecord[];
  sourceStatus: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseEidKitsEvidence(value: unknown): EidKitsEvidence | null {
  if (!isRecord(value)) return null;
  if (!Array.isArray(value.history) || !Array.isArray(value.breakdown2026)) return null;
  if (typeof value.sourceStatus !== "string") return null;

  const history: EidKitsYearRecord[] = [];
  for (const item of value.history) {
    if (!isRecord(item)) return null;
    if (typeof item.year !== "number" || typeof item.families !== "number") return null;
    if (item.donations !== undefined && typeof item.donations !== "string") return null;
    if (item.kitCost !== undefined && typeof item.kitCost !== "string") return null;
    if (item.detailedExpenditure !== undefined && typeof item.detailedExpenditure !== "string") return null;
    if (item.notes !== undefined && typeof item.notes !== "string") return null;

    history.push({
      year: item.year,
      families: item.families,
      donations: item.donations,
      kitCost: item.kitCost,
      detailedExpenditure: item.detailedExpenditure,
      notes: item.notes,
    });
  }

  const breakdown2026: EidKitsBreakdownRecord[] = [];
  for (const item of value.breakdown2026) {
    if (!isRecord(item)) return null;
    if (typeof item.label !== "string" || typeof item.count !== "number" || typeof item.share !== "string") return null;
    breakdown2026.push({ label: item.label, count: item.count, share: item.share });
  }

  const total2026 = breakdown2026.reduce((sum, item) => sum + item.count, 0);
  const record2026 = history.find(item => item.year === 2026);
  if (!record2026 || record2026.families !== 710 || total2026 !== 710) return null;

  return { history, breakdown2026, sourceStatus: value.sourceStatus };
}
