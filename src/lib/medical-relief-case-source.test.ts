import { describe, expect, it } from "vitest";
import { programmes } from "@/lib/master-copy";
import { documentedAssistanceTotal } from "@/lib/documented-assistance";
import importMaster from "../../prisma/master-programmes.json";

const knownSix = [
  "auto-rickshaw-livelihood-support",
  "emergency-neonatal-medical-aid",
  "oral-cancer-surgery-support",
  "aliza-critical-care-support",
  "severe-burn-treatment-support",
  "jewellery-loan-intervention",
];

describe("Medical & Financial Relief case-source integration", () => {
  const cases = programmes.filter(record => record.causeSlug === "medical-financial-relief");

  it("preserves six established records and adds exactly two distinct 2026 cases", () => {
    expect(cases).toHaveLength(8);
    expect(knownSix.every(slug => cases.some(record => record.slug === slug))).toBe(true);
    expect(new Set(cases.map(record => record.slug)).size).toBe(8);
  });

  it("identifies assistance given to date without calling it money raised or final treatment cost", () => {
    const caseRecord = cases.find(record => record.slug === "accident-recovery-support-2026");
    expect(caseRecord).toBeDefined();
    expect(caseRecord?.title).toBe("A Journey of Recovery, Supported Together");
    expect(caseRecord?.programmeStatus).toBe("ONGOING");
    expect(caseRecord?.primaryMetric).toBe("₹82,000");
    expect(caseRecord?.primaryMetricLabel).toMatch(/assistance provided to date/i);
    expect(caseRecord?.summary).toMatch(/ongoing/i);
    expect(caseRecord?.story).not.toMatch(/fully recovered|case closed|₹80,000|total raised/i);
  });

  it("records a closed collection and delivered assistance, not a live appeal", () => {
    const caseRecord = cases.find(record => record.slug === "medical-recovery-relief-2026");
    expect(caseRecord).toBeDefined();
    expect(caseRecord?.title).toBe("Standing Together Through a Difficult Recovery");
    expect(caseRecord?.programmeStatus).toBe("COMPLETED");
    expect(caseRecord?.primaryMetric).toBe("₹1,26,000");
    expect(caseRecord?.primaryMetricLabel).toMatch(/collected and handed over/i);
    expect(caseRecord?.story).toMatch(/collection is closed/i);
    expect(caseRecord?.summary + " " + caseRecord?.story).not.toMatch(/donate now|support this appeal|tax deduction|full medical recovery/i);
  });

  it("keeps the two reviewed source catalogues aligned", () => {
    const sameCases = importMaster.initiatives.filter(record => record.causeSlug === "medical-financial-relief");
    expect(sameCases).toHaveLength(8);
    expect(sameCases.map(record => ({ slug: record.slug, title: record.title, summary: record.summary, story: record.story, primaryMetric: record.primaryMetric, primaryMetricLabel: record.primaryMetricLabel, programmeStatus: record.programmeStatus })))
      .toEqual(cases.map(record => ({ slug: record.slug, title: record.title, summary: record.summary, story: record.story, primaryMetric: record.primaryMetric, primaryMetricLabel: record.primaryMetricLabel, programmeStatus: record.programmeStatus })));
  });

  it("keeps the original six comparable measures separate from the two new figures", () => {
    expect(documentedAssistanceTotal()).toBe(1_214_520);
  });

  it("does not publish identifying names, medical images or private document references in the new source copy", () => {
    const newRecords = cases.filter(record => ["accident-recovery-support-2026", "medical-recovery-relief-2026"].includes(record.slug));
    expect(newRecords).toHaveLength(2);
    for (const record of newRecords) {
      const text = [record.title, record.summary, record.story].join(" ");
      expect(text).not.toMatch(/Mohammed Riyaz|Mr\. Khaja|patient ID|hospital record|WhatsApp Image/i);
      expect(record).not.toHaveProperty("coverImageUrl");
    }
  });
});
