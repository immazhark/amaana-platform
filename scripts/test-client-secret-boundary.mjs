import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const scanner = fileURLToPath(new URL("./check-client-secret-boundary.mjs", import.meta.url));
const canary = "amaana-regression-canary-not-a-real-secret-20261010";

function runScanner(contents, environment = {}, filename = "client.js", assetRoot = ".next/static") {
  const root = mkdtempSync(path.join(os.tmpdir(), "amaana-secret-boundary-"));
  try {
    const staticDir = path.join(root, ".next", "static");
    mkdirSync(staticDir, { recursive: true });
    const filePath = path.join(root, assetRoot, filename);
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, contents);
    return spawnSync(process.execPath, [scanner], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, ...environment, AMAANA_CLIENT_SECRET_CANARY: canary },
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("client bundle guard accepts clean static files", () => {
  const result = runScanner("console.log('safe client bundle')");
  assert.equal(result.status, 0, result.stderr);
});

test("client bundle guard catches forbidden environment variable names", () => {
  const result = runScanner("const suspect = 'RAZORPAY_WEBHOOK_SECRET';");
  assert.equal(result.status, 1);
  assert.match(result.stderr, /RAZORPAY_WEBHOOK_SECRET/);
});

test("client bundle guard catches embedded values but never prints them", () => {
  const result = runScanner(`const embedded = "${canary}";`);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /REDACTED SECRET VALUE/);
  assert.doesNotMatch(result.stderr, new RegExp(canary));
  assert.doesNotMatch(result.stdout, new RegExp(canary));
});

test("client bundle guard catches inlined configured server secrets", () => {
  const value = "safe-fake-long-server-secret-value-for-unit-tests";
  const result = runScanner(`const leaked = "${value}";`, {
    RAZORPAY_WEBHOOK_SECRET: value,
  });
  assert.equal(result.status, 1);
  assert.doesNotMatch(result.stderr, new RegExp(value));
});

test("client bundle scanner checks public JSON and other textual static assets", () => {
  for (const filename of [
    "data/config.json", "brand/mark.svg", "metadata.txt", "index.html",
    "manifest.xml", "app.webmanifest",
  ]) {
    const result = runScanner(`public embedded ${canary}`, {}, filename);
    assert.equal(result.status, 1, `Unscanned public asset: ${filename}`);
    assert.match(result.stderr, /REDACTED SECRET VALUE/);
    assert.doesNotMatch(result.stderr, new RegExp(canary));
    assert.doesNotMatch(result.stdout, new RegExp(canary));
  }
  const clean = runScanner('{"title":"Reviewed public metadata"}', {}, "data/public.json");
  assert.equal(clean.status, 0, clean.stderr);
});

test("client bundle scanner fails closed on symlinked public files and directories", () => {
  for (const directoryLink of [false, true]) {
    const root = mkdtempSync(path.join(os.tmpdir(), "amaana-secret-symlink-"));
    try {
      const staticDir = path.join(root, ".next", "static");
      mkdirSync(staticDir, { recursive: true });
      const target = path.join(root, directoryLink ? "outside" : "outside.js");
      if (directoryLink) {
        mkdirSync(target);
        writeFileSync(path.join(target, "client.js"), `const token = "${canary}";`);
      } else {
        writeFileSync(target, `const token = "${canary}";`);
      }
      symlinkSync(target, path.join(staticDir, directoryLink ? "linked" : "linked.js"),
        directoryLink ? "dir" : "file");
      const result = spawnSync(process.execPath, [scanner], {
        cwd: root, encoding: "utf8",
        env: { ...process.env, AMAANA_CLIENT_SECRET_CANARY: canary },
      });
      assert.equal(result.status, 1, "Symlink bypassed static asset guard");
      assert.match(result.stderr, /Symbolic link in public client bundle/);
      assert.doesNotMatch(result.stderr, new RegExp(canary));
      assert.doesNotMatch(result.stdout, new RegExp(canary));
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

test("scanner checks directly served public assets without printing embedded values", () => {
 for (const filename of ["config.json","nested/metadata.txt","brand/mark.svg"]) {
  const result=runScanner(`embedded ${canary}`,{},filename,"public");
  assert.equal(result.status,1,filename);
  assert.match(result.stderr,/REDACTED SECRET VALUE/);
  assert.ok(!result.stderr.includes(canary));assert.ok(!result.stdout.includes(canary));
 }
 const clean=runScanner('{"title":"Approved metadata"}',{},"config.json","public");
 assert.equal(clean.status,0,clean.stderr);
});
test("scanner rejects a symlinked public root",()=>{
 const root=mkdtempSync(path.join(os.tmpdir(),"amaana-public-root-"));
 try {
  mkdirSync(path.join(root,".next/static"),{recursive:true});
  mkdirSync(path.join(root,"outside"));
  symlinkSync(path.join(root,"outside"),path.join(root,"public"),"dir");
  const result=spawnSync(process.execPath,[scanner],{cwd:root,encoding:"utf8"});
  assert.equal(result.status,1);assert.match(result.stderr,/Symbolic link/);
 } finally {rmSync(root,{recursive:true,force:true});}
});

test("public assets cannot substitute for the required build directory",()=>{
 const root=mkdtempSync(path.join(os.tmpdir(),"amaana-public-without-build-"));
 try {
  mkdirSync(path.join(root,"public"));writeFileSync(path.join(root,"public/config.json"),"{}");
  const result=spawnSync(process.execPath,[scanner],{cwd:root,encoding:"utf8"});
  assert.equal(result.status,1);assert.match(result.stderr,/completed Next.js build/);
 } finally {rmSync(root,{recursive:true,force:true});}
});
