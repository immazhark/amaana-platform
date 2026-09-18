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
const excludedBasenames = new Set([
  "master-copy.json",
]);
const excludedPatterns = [
  /\.test\.[cm]?[jt]sx?$/i,
  /browser-acceptance/i,
];

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
];

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
];

async function walk(directory, output = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, output);
      continue;
    }
    if (!entry.isFile()) continue;
    if (!includedExtensions.has(path.extname(entry.name))) continue;
    if (excludedBasenames.has(entry.name)) continue;
    if (excludedPatterns.some(pattern => pattern.test(fullPath))) continue;
    output.push(fullPath);
  }
  return output;
}

export function scanEditorialRisks(filename, content) {
  const findings = [];
  for (const rule of [...staleFacts, ...complianceRisks]) {
    rule.pattern.lastIndex = 0;
    for (const match of content.matchAll(rule.pattern)) {
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
  console.log("Canonical locks checked: ₹107,520 neonatal aid; 234 Winter Kits/234 beneficiaries; provisional 80G/12A wording; domestic-only/FCRA boundary.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkPublicEditorialConsistency().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
