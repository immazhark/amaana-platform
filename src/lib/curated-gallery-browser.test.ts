import { webcrypto } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readApprovedCuratedManifest } from "./curated-gallery-browser";
import { CURATED_GALLERY_MANIFEST_SHA256 } from "./curated-gallery-identity";

const approvedDigest = Uint8Array.from(CURATED_GALLERY_MANIFEST_SHA256.match(/../g)!, byte => parseInt(byte, 16)).buffer;
afterEach(() => vi.unstubAllGlobals());

describe("checksum-authenticated browser manifest", () => {
  it.each(['{"records":[]}', '{"records":[{"relativePath":"../../private"}]}', "not JSON"])("rejects unapproved bytes before parsing: %s", async text => {
    vi.stubGlobal("crypto", webcrypto);
    await expect(readApprovedCuratedManifest(new TextEncoder().encode(text))).rejects.toThrow("Manifest SHA-256");
  });

  it("decodes only the exact bytes submitted to SHA-256, despite caller mutation", async () => {
    const text = '{"version":1,"records":[]}';
    const bytes = new TextEncoder().encode(text);
    let finish!: (digest: ArrayBuffer) => void;
    const digest = vi.fn((_algorithm, snapshot) => {
      expect(snapshot).not.toBe(bytes);
      expect(new TextDecoder().decode(snapshot)).toBe(text);
      return new Promise<ArrayBuffer>(resolve => { finish = resolve; });
    });
    vi.stubGlobal("crypto", { subtle: { digest } });
    const result = readApprovedCuratedManifest(bytes);
    bytes.fill(0);
    finish(approvedDigest);
    await expect(result).resolves.toEqual({ manifestText: text, manifest: { version: 1, records: [] } });
    expect(digest).toHaveBeenCalledWith("SHA-256", expect.any(Uint8Array));
  });

  it("fails closed when Web Crypto rejects", async () => {
    vi.stubGlobal("crypto", { subtle: { digest: vi.fn().mockRejectedValue(new Error("crypto unavailable")) } });
    await expect(readApprovedCuratedManifest(new Uint8Array())).rejects.toThrow("crypto unavailable");
  });

  it("rejects invalid UTF-8 even after a successful digest", async () => {
    vi.stubGlobal("crypto", { subtle: { digest: vi.fn().mockResolvedValue(approvedDigest) } });
    await expect(readApprovedCuratedManifest(new Uint8Array([0xff]))).rejects.toThrow();
  });
});
