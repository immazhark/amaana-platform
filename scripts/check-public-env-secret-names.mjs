import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const credentialMarker = /(?:^|_)(?:SECRET|PASSWORD|PRIVATE_KEY|ACCESS_KEY|API_TOKEN|AUTH_TOKEN|CREDENTIALS?)(?:_|$)/;
const storageMarker = /(?:^|_)(?:S3|R2|AWS|MEDIA|STORAGE)(?:_|$)/;
const keyMarker = /(?:^|_)(?:KEY|TOKEN)(?:_|$)/;

export function rejectPublicCredentialNames(env, declaredNames = []) {
  return [...new Set([...Object.keys(env), ...declaredNames])]
    .filter((name) => {
      if (!/^NEXT_PUBLIC_[A-Z][A-Z0-9_]*$/.test(name)) return false;
      const suffix = name.slice("NEXT_PUBLIC_".length);
      return credentialMarker.test(suffix) || (storageMarker.test(suffix) && keyMarker.test(suffix));
    })
    .sort()
    .map((name) => `${name} must not expose credential settings through NEXT_PUBLIC_.`);
}

async function declaredPublicNames(directory, mode) {
  const names = [];
  for (const name of [`.env.${mode}.local`, ".env.local", `.env.${mode}`, ".env"]) {
    let content;
    try {
      content = await readFile(path.join(directory, name), "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    for (const match of content.matchAll(/^[ \t]*(?:export[ \t]+)?(NEXT_PUBLIC_[A-Z][A-Z0-9_]*)[ \t]*=/gm)) {
      names.push(match[1]);
    }
  }
  return names;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv.includes("--development") ? "development" : "production";
  const names = await declaredPublicNames(process.cwd(), mode);
  const problems = rejectPublicCredentialNames(process.env, names);
  if (problems.length > 0) {
    for (const problem of problems) console.error(problem);
    process.exitCode = 1;
  }
}
