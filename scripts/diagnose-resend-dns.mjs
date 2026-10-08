#!/usr/bin/env node
// Read-only public DNS diagnostic for the Amaana Foundation Resend release gate.
// No credentials, environment variables, or DNS writes are required.
import { Resolver } from "node:dns/promises";

const domain = "amaanafoundation.org";
const resolver = new Resolver();
resolver.setServers(["1.1.1.1", "8.8.8.8"]);

const checks = [
  { id: "DKIM", type: "TXT", host: `resend._domainkey.${domain}`,
    valid: (answers) => answers.some((value) => /^p=MI[A-Za-z0-9+/=]+$/.test(value.replace(/\s/g, ""))) },
  { id: "Return-Path MX", type: "MX", host: `send.${domain}`,
    valid: (answers) => answers.some((value) => value.exchange.replace(/\.$/, "").toLowerCase() === "feedback-smtp.us-east-1.amazonses.com" && value.priority === 10) },
  { id: "Return-Path SPF", type: "TXT", host: `send.${domain}`,
    valid: (answers) => answers.some((value) => /^v=spf1\s+include:amazonses\.com\s+~all$/i.test(value.trim())) },
  { id: "Tracking CNAME", type: "CNAME", host: `rsend.${domain}`,
    valid: (answers) => answers.some((value) => value.replace(/\.$/, "").toLowerCase() === "send.forge.rmta.net") },
];

let failures = 0;
for (const check of checks) {
  try {
    const answers = check.type === "MX"
      ? await resolver.resolveMx(check.host)
      : check.type === "CNAME"
        ? await resolver.resolveCname(check.host)
        : (await resolver.resolveTxt(check.host)).map((parts) => parts.join(""));
    const passed = check.valid(answers);
    if (!passed) failures++;
    console.log(`${passed ? "PASS" : "FAIL"} ${check.id}: ${check.host} (${answers.length} DNS answer(s); ${passed ? "matches expected shape" : "record missing/mismatched"})`);
  } catch (error) {
    failures++;
    console.error(`UNKNOWN ${check.id}: ${check.host} (${error.code ?? "DNS_ERROR"} — resolver failed; NOT evidence that the record is absent)`);
  }
}
if (failures) {
  console.error(`Resend DNS preflight not verified: ${failures}/${checks.length} checks failed or could not be resolved. This check does not establish Resend provider verification status.`);
  process.exitCode = 1;
} else {
  console.log("Public DNS records match expected values. Resend provider verification and controlled email acceptance remain separate release gates.");
}
