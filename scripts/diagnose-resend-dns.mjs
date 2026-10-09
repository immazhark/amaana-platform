#!/usr/bin/env node
// Read-only public DNS diagnostic for the Amaana Foundation Resend release gate.
// No credentials, environment variables, or DNS writes are required.
import { Resolver } from "node:dns/promises";

// Diagnose delegation independently; a recursive ENODATA response is not proof of absence.
const systemResolver = new Resolver();
const publicResolvers = [{ name: "Cloudflare", ip: "1.1.1.1" }, { name: "Google", ip: "8.8.8.8" }];
async function diagnoseDelegation(domain) {
  for (const server of publicResolvers) {
    const probe = new Resolver();
    probe.setServers([server.ip]);
    try {
      const ns = await probe.resolveNs(domain);
      console.log(`DELEGATION ${server.name}: ${ns.join(", ") || "(empty answer)"}`);
    } catch (error) {
      console.error(`DELEGATION UNKNOWN ${server.name}: ${error.code ?? "DNS_ERROR"}`);
    }
  }
  try {
    const ns = await systemResolver.resolveNs(domain);
    console.log(`DELEGATION system: ${ns.join(", ") || "(empty answer)"}`);
  } catch (error) {
    console.error(`DELEGATION UNKNOWN system: ${error.code ?? "DNS_ERROR"}`);
  }
}


const domain = "amaanafoundation.org";
// Resend-issued DKIM public key (not a signing private key). Update only after provider rotation.
const expectedDkim = "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDUxz7mTdpmCy0t5/jxTdA4b9VhZLj3bjDAM6+btZdiPFlLljdeX7g5EsXKJ5YsgtFWW9DutfaUcvrO/7L7+Exi6GNeYzxNohTdvnIG/+TEV/Hou/Oneo5Pj8Qr7YKvh/7wC7svPPIJJfqleoogwHdb5mFaFNDPdqY9ZLOaVHj22QIDAQAB";
const resolver = new Resolver();
resolver.setServers(["1.1.1.1", "8.8.8.8"]);

const checks = [
  { id: "DKIM", type: "TXT", host: `resend._domainkey.${domain}`,
    valid: (answers) => answers.some((value) => value.replace(/\s/g, "") === expectedDkim.replace(/\s/g, "")) },
  { id: "Return-Path MX", type: "MX", host: `send.${domain}`,
    valid: (answers) => answers.some((value) => value.exchange.replace(/\.$/, "").toLowerCase() === "feedback-smtp.us-east-1.amazonses.com" && value.priority === 10) },
  { id: "Return-Path SPF", type: "TXT", host: `send.${domain}`,
    valid: (answers) => answers.some((value) => /^v=spf1\s+include:amazonses\.com\s+~all$/i.test(value.trim())) },
  { id: "Tracking CNAME", type: "CNAME", host: `rsend.${domain}`,
    valid: (answers) => answers.some((value) => value.replace(/\.$/, "").toLowerCase() === "send.forge.rmta.net") },
];

await diagnoseDelegation(domain);

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
    console.log(`${passed ? "PASS" : "FAIL"} ${check.id}: ${check.host} (${answers.length} DNS answer(s); ${passed ? "matches exact expected value" : "record missing/mismatched"})`);
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
