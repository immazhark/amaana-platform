#!/usr/bin/env node
/**
 * AF-R078: read-only, local static Markdown backlink inventory for dated audit
 * documents. This is NOT an archival or deletion approval. Dynamic references,
 * deployed routes, Git history, legal retention, and externally published links
 * cannot be proven absent by a static source scan.
 */
import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const MAX_MARKDOWN_BYTES = 10 * 1024 * 1024;
const datedName = /((?:19|20)\d{2})[-_](0[1-9]|1[0-2])[-_](0[1-9]|[12]\d|3[01])/;

function isValidDatedName(name) {
  const match = datedName.exec(name);
  if (!match) return false;
  const stamp = `${match[1]}-${match[2]}-${match[3]}`;
  const day = new Date(stamp + "T00:00:00.000Z");
  return Number.isFinite(day.getTime()) && day.toISOString().slice(0, 10) === stamp;
}

function assertRegularFile(path) {
  const state = lstatSync(path);
  if (state.isSymbolicLink()) throw new Error("Refusing symbolic link in local document scan");
  if (!state.isFile()) throw new Error("Expected a regular Markdown file");
  if (state.size > MAX_MARKDOWN_BYTES) throw new Error("Markdown file exceeds bounded scan limit");
}

function pathWithin(root, path) {
  const rel = relative(root, path);
  if (rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel)) return null;
  return rel.split(sep).join("/");
}

function resolveMarkdownLink(root, from, raw) {
  let target = raw.trim();
  if (target.startsWith("<") && target.endsWith(">")) target = target.slice(1, -1);
  if (!target || target.startsWith("#") || target.startsWith("//")) return null;

  // Canonical HTTPS links to this repository's main-branch docs are local
  // backlinks too. Other origins, repositories and refs remain external.
  if (/^[a-z][a-z\d+.-]*:/i.test(target)) {
    let url;
    try { url = new URL(target); } catch { return null; }
    const prefix = url.origin === "https://github.com"
      ? "/immazhark/amaana-platform/blob/main/docs/"
      : url.origin === "https://raw.githubusercontent.com"
        ? "/immazhark/amaana-platform/main/docs/"
        : null;
    if (!prefix || url.username || url.password || !url.pathname.startsWith(prefix)) return null;
    target = "docs/" + url.pathname.slice(prefix.length);
  }

  target = target.split(/[?#]/, 1)[0] ?? "";
  try { target = decodeURIComponent(target); } catch { return null; }
  if (!target.toLowerCase().endsWith(".md")) return null;

  // References beginning with docs/ are repository-relative. Plain ../ and
  // ./ links remain source-file-relative, like ordinary Markdown documents.
  const destination = target.startsWith("/")
    ? resolve(root, "." + target)
    : target.startsWith("docs/")
      ? resolve(root, target)
      : resolve(dirname(from), target);
  return pathWithin(root, destination);
}

function collectMarkdownPaths(root) {
  const docsRoot = join(root, "docs");
  const docsStat = lstatSync(docsRoot);
  if (docsStat.isSymbolicLink()) throw new Error("Refusing symbolic link as docs root");
  if (!docsStat.isDirectory()) throw new Error("Expected local docs directory");

  const markdownFiles = [];
  const scan = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error("Refusing symbolic link in local document scan");
      if (entry.isDirectory()) scan(path);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        assertRegularFile(path);
        markdownFiles.push(path);
      }
    }
  };
  scan(docsRoot);

  // Root-level Markdown files may link to a dated document within docs/.
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.name.toLowerCase().endsWith(".md")) continue;
    const path = join(root, entry.name);
    if (entry.isSymbolicLink()) throw new Error("Refusing symbolic link in local document scan");
    if (entry.isFile()) {
      assertRegularFile(path);
      markdownFiles.push(path);
    }
  }
  return markdownFiles.sort((a, b) => a.localeCompare(b));
}

export function collectDatedDocumentBacklinks(rootDirectory = process.cwd()) {
  const root = resolve(rootDirectory);
  const rootStat = lstatSync(root);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new Error("Refusing non-directory or symbolic link project root");
  }
  const paths = collectMarkdownPaths(root);
  const candidates = paths.filter(path =>
    pathWithin(root, path)?.startsWith("docs/") && isValidDatedName(basename(path)),
  );
  const inbound = new Map(candidates.map(path => [pathWithin(root, path), new Set()]));

  for (const source of paths) {
    const contents = readFileSync(source, "utf8");
    const sourcePath = pathWithin(root, source);
    // A definition can be referenced by [text][id] elsewhere in the file.
    // Count it conservatively as a potential backlink even when static use
    // cannot be proved; this report never authorizes document deletion.
    const patterns = [
      /\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+["'][^"']+["'])?\s*\)/g,
      /^\s{0,3}\[[^\]\r\n]+\]:\s*(<[^>]+>|[^\s]+)/gm,
      // Markdown permits raw HTML with quoted or unquoted href values.
      // Preserve backlinks conservatively; never authorize document deletion.
      /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'=<>\x60]+))/gi,
    ];
    for (const pattern of patterns) {
      for (const match of contents.matchAll(pattern)) {
        const target = resolveMarkdownLink(root, source, match[1] ?? match[2] ?? match[3] ?? "");
        if (!target || target === sourcePath || !inbound.has(target)) continue;
        inbound.get(target).add(sourcePath);
      }
    }
  }

  const documents = [...inbound.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([path, from]) => {
    const referencedBy = [...from].sort();
    return {
      path,
      disposition: referencedBy.length ? "REVIEW_LINKED" : "REVIEW_UNLINKED_STATIC_ONLY",
      referencedBy,
    };
  });
  return {
    source: "local-markdown-reference-inventory",
    deletionApproved: false,
    limitation: "Missing static links are not proof a document is unused. Dynamic imports, historic links, deployed refs and retention policy require separate review; nothing here authorizes deletion.",
    scannedMarkdownFiles: paths.length,
    documents,
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (process.argv.length !== 2 && !(process.argv.length === 3 && process.argv[2] === "--json")) {
    process.stderr.write("Only optional --json is accepted; this audit never modifies files.\n");
    process.exitCode = 2;
  } else {
    try {
      const report = collectDatedDocumentBacklinks();
      if (process.argv.includes("--json")) process.stdout.write(JSON.stringify(report, null, 2) + "\n");
      else process.stdout.write(`Dated docs: ${report.documents.length}; referenced: ${report.documents.filter(d => d.referencedBy.length).length}\n${report.limitation}\n`);
    } catch (error) {
      process.stderr.write("Read-only dated docs audit aborted: " + (error instanceof Error ? error.message : "unknown error") + "\n");
      process.exitCode = 1;
    }
  }
}
