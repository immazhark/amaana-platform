import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const publicRoots = [
  "src/app",
  "src/components",
  "src/content",
  "src/lib",
];

const includedExtensions = new Set([".ts", ".tsx", ".json"]);
const excludedPatterns = [
  /\.test\.[cm]?[jt]sx?$/i,
  /browser-acceptance/i,
];
// The master editorial source may retain superseded figures for provenance, so the stale-fact
// locks skip it. Every compliance rule still applies to it: it holds the Ramadan, Zakat and FAQ copy.
const complianceOnlyBasenames = new Set(["master-copy.json"]);

const staleFacts = [
  {
    id: "newborn-old-amount",
    pattern: /₹\s*107[,.]?200\b/g,
    message: "Use the confirmed neonatal medical-aid amount ₹107,520.",
  },
  {
    id: "winter-superseded-plus-total",
    pattern: /234\+[^\n]{0,80}(?:beneficiar|winter)/gi,
    message: "Use the canonical Winter Drive total: 234 Winter Kits to 234 beneficiaries.",
  },
  {
    id: "aliza-rounded-amount",
    pattern: /₹\s*4\.82\s*L\b/gi,
    message: "Use the exact documented Aliza medical-aid amount ₹482,700 on public surfaces.",
  },
];

// `negatable` rules describe a claim that is only acceptable inside a negation
// ("is not ...", "no ... promised"), so a match preceded by a negation word is allowed.
// `requiresNearby` rules need a qualifying word within `radius` characters either side.
const complianceRisks = [
  {
    id: "permanent-80g",
    pattern: /\b(?:permanent|final)\s+80G\b/gi,
    message: "Amaana's known 80G approval is provisional; do not describe it as permanent/final.",
  },
  {
    id: "permanent-12a",
    pattern: /\b(?:permanent|final)\s+12A(?:B)?\b/gi,
    message: "Amaana's confirmed 12A/12AB status must be described as provisional.",
  },
  {
    id: "positive-fcra-registration",
    pattern: /\b(?:Amaana(?: Foundation)?|the Foundation|we)\s+(?:is|are)\s+FCRA[- ]registered\b/gi,
    message: "Amaana is not FCRA-registered; public copy must not claim otherwise.",
  },
  {
    id: "foreign-donation-acceptance",
    pattern: /\b(?:Amaana(?: Foundation)?|the Foundation|we)\s+(?:currently\s+)?(?:accept|accepts|are accepting)\s+(?:international|foreign|overseas)\s+(?:donations?|contributions?)\b/gi,
    message: "Public fundraising must remain domestic-only until FCRA status changes.",
  },
  {
    id: "tax-benefit-claim",
    pattern: /\b(?:tax[- ]?(?:deduct\w*|exempt\w*|benefit\w*|saving\w*|rebate)|claim (?:a )?deduction)\b/gi,
    negatable: true,
    message: "80G status is unresolved; do not promise or imply a tax benefit except inside a clear negation.",
  },
  {
    id: "fcra-approval-claim",
    pattern: /\bFCRA[- ](?:approved|compliant|certified)\b/gi,
    negatable: true,
    message: "Amaana holds no FCRA approval; do not describe it as approved, compliant or certified.",
  },
  {
    id: "foreign-donors-welcome",
    pattern: /\b(?:NRI|overseas|international|foreign)\s+(?:donors?|donations?|contributions?)\s+(?:are\s+)?(?:welcome|accepted)\b/gi,
    negatable: true,
    message: "Public fundraising is domestic-only; do not invite foreign contributions.",
  },
  {
    id: "religious-ruling-claim",
    pattern: /\b(?:is|are)\s+(?:halal|haram|obligatory|wajib|fard)\b|\bfatwa\b|\bguarantee[sd]?\s+(?:reward|thawab|barakah)\b/gi,
    negatable: true,
    message: "Public copy must not issue religious rulings or guarantee spiritual reward.",
  },
  {
    id: "unqualified-12a",
    pattern: /\b12A(?:B)?\b/g,
    requiresNearby: /provisional/i,
    radius: 220,
    message: "Every mention of 12A/12AB must sit next to the word provisional.",
  },
];

const NEGATION = /\b(?:no|not|never|nor|neither|without|cannot|isn't|doesn't|don't|n't)\b|\bnot\b/i;

async function walk(directory, output = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, output);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!includedExtensions.has(path.extname(entry.name))) continue;
    if (excludedPatterns.some(pattern => pattern.test(fullPath))) continue;
    output.push(fullPath);
  }
  return output;
}

function ruleAllows(rule, content, match) {
  if (rule.negatable) {
    const before = content.slice(Math.max(0, match.index - 120), match.index);
    if (NEGATION.test(before)) return true;
  }
  if (rule.requiresNearby) {
    const window = content.slice(Math.max(0, match.index - rule.radius), match.index + match[0].length + rule.radius);
    if (rule.requiresNearby.test(window)) return true;
    return false;
  }
  return !rule.negatable;
}

export function scanEditorialRisks(filename, content) {
  const findings = [];
  const complianceOnly = complianceOnlyBasenames.has(path.basename(filename));
  const rules = complianceOnly ? complianceRisks : [...staleFacts, ...complianceRisks];
  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    for (const match of content.matchAll(rule.pattern)) {
      if ((rule.negatable || rule.requiresNearby) && ruleAllows(rule, content, match)) continue;
      const before = content.slice(0, match.index);
      const line = before.split("\n").length;
      findings.push({
        file: filename,
        line,
        id: rule.id,
        match: match[0],
        message: rule.message,
      });
    }
  }
  return findings;
}

export async function checkPublicEditorialConsistency() {
  const files = [];
  for (const root of publicRoots) await walk(root, files);

  const findings = [];
  for (const filename of files.sort()) {
    const content = await readFile(filename, "utf8");
    findings.push(...scanEditorialRisks(filename, content));
  }

  if (findings.length) {
    const details = findings
      .map(item => `${item.file}:${item.line} [${item.id}] ${JSON.stringify(item.match)} — ${item.message}`)
      .join("\n");
    throw new Error(`Public editorial consistency check failed:\n${details}`);
  }

  console.log(`Public editorial consistency check passed across ${files.length} source files.`);
  console.log("Canonical locks checked: ₹107,520 neonatal aid; 234 Winter Kits/234 beneficiaries; provisional 80G/12A wording; domestic-only/FCRA boundary; no tax-benefit, FCRA-approval or religious-ruling claims (master-copy.json included for compliance rules).");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkPublicEditorialConsistency().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
