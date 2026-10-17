import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const titlePattern = /^(feat|fix|chore|docs|test|refactor|perf|security|content)(\([a-z0-9-]+\))?: .{8,}$/;
const branchPattern = /^(feat|fix|chore|docs|test|refactor|perf|security|content)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const requiredSections = ["Purpose", "Acceptance criteria", "Verification", "Release plan"];

function section(body, heading) {
  const lines = body.split(/\r?\n/);
  const pos = lines.findIndex(line => line.trim().toLowerCase() === `## ${heading.toLowerCase()}`);
  if (pos === -1) return null;
  const end = lines.findIndex((line, i) => i > pos && /^##\s+\S/.test(line));
  return lines.slice(pos + 1, end === -1 ? undefined : end).join("\n").trim();
}

/** Fast, dependency-free GitHub PR policy. Structural automation supports
 * human review; it cannot determine whether a change is one semantic feature. */
export function validatePrContract(input) {
  if (!input || typeof input !== "object") return ["Missing PR metadata."];
  const errors = [];
  const { title, branch, body, files, draft } = input;
  if (typeof title !== "string" || !titlePattern.test(title))
    errors.push("PR title must use a conventional prefix, e.g. feat: precise outcome.");
  if (typeof branch !== "string" || !branchPattern.test(branch))
    errors.push("PR branch must be a lowercase task branch: feat|fix|chore|docs|test|refactor|perf|security|content/short-name.");
  if (!Array.isArray(files) || !files.length || files.some(file => typeof file !== "string"))
    errors.push("PR changed files could not be established.");
  const text = typeof body === "string" ? body.replace(/<!--[\s\S]*?(?:-->|$)/g, "") : "";
  for (const heading of requiredSections) {
    const content = section(text, heading);
    if (!content || content.length < 20)
      errors.push(`Section "${heading}" must explain the independently releasable change.`);
    else if (["Acceptance criteria", "Verification"].includes(heading) && !/^\s*-\s+\[[ xX]\]\s+\S.{7,}$/m.test(content))
      errors.push(`Section "${heading}" needs a concrete checklist item.`);
  }
  // Drafts may document pending work. Ready PRs must explicitly record
  // completion rather than passing a blank prefilled PR template.
  if (draft === false) {
    for (const heading of ["Acceptance criteria", "Verification"]) {
      const content = section(text, heading) || "";
      if (/^\s*-\s+\[ \]/m.test(content) || !/^\s*-\s+\[[xX]\]\s+\S/m.test(content)) {
        errors.push(`Ready PR has unchecked or unconfirmed "${heading}" items; keep it draft until verified.`);
      }
    }
  }
  if (Array.isArray(files) && files.length > 25) {
    const explanation = section(text, "Scope rationale");
    if (!explanation || explanation.length < 80) errors.push(
      `PR scope is ${files.length} files (review threshold 25). Split unrelated changes or document why one coherent feature requires this many files under "## Scope rationale".`
    );
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.env.GITHUB_EVENT_NAME !== "pull_request") {
    console.log("PR contract: non-pull-request event; skip.");
  } else {
    try {
      const eventPath = process.env.GITHUB_EVENT_PATH;
      if (!eventPath) throw new Error("GITHUB_EVENT_PATH is required on pull_request.");
      const event = JSON.parse(readFileSync(eventPath, "utf8"));
      const pr = event.pull_request;
      const baseSha = pr?.base?.sha;
      if (typeof baseSha !== "string" || !/^[a-f0-9]{40}$/i.test(baseSha))
        throw new Error("Missing valid PR base commit SHA.");
      // CI plan job already checks out the PR merge ref with full history.
      // Compare to the event's base so the file list includes the whole PR.
      const files = execFileSync("git", ["diff", "--name-only", baseSha, "HEAD"], {
        encoding: "utf8", maxBuffer: 2_000_000,
      }).trim().split("\n").filter(Boolean);
      const errors = validatePrContract({
        title: pr?.title,
        branch: pr?.head?.ref,
        body: pr?.body,
        draft: pr?.draft,
        files,
      });
      if (errors.length) {
        for (const message of errors) console.error(`::error::${message}`);
        process.exitCode = 1;
      } else console.log(`PR contract passed: ${files.length} files; one release scope still requires human review.`);
    } catch (error) {
      console.error(`::error::PR contract could not be verified: ${error instanceof Error ? error.message : "Unknown error"}`);
      process.exitCode = 1;
    }
  }
}
