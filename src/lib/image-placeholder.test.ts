import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createImagePlaceholder, isValidPlaceholder, PLACEHOLDER_MAX_DATA_URL_LENGTH, PLACEHOLDER_MAX_EDGE } from "./image-placeholder";

const synthetic = (width: number, height: number, format: "jpeg" | "png" = "jpeg") =>
  sharp({ create: { width, height, channels: 3, background: { r: 70, g: 111, b: 170 } } })[format]().toBuffer();

describe("AF-R056 image placeholder contract", () => {
  it("returns a bounded WebP data URL for a valid image", async () => {
    const url = await createImagePlaceholder(await synthetic(1600, 1000));
    expect(url).not.toBeNull();
    expect(isValidPlaceholder(url)).toBe(true);
    expect(url!.length).toBeLessThanOrEqual(PLACEHOLDER_MAX_DATA_URL_LENGTH);
  });

  it("downsizes to the maximum edge and preserves aspect ratio", async () => {
    const url = await createImagePlaceholder(await synthetic(1600, 800, "png"));
    const meta = await sharp(Buffer.from(url!.split(",")[1], "base64")).metadata();
    expect(Math.max(meta.width!, meta.height!)).toBeLessThanOrEqual(PLACEHOLDER_MAX_EDGE);
    expect(meta.width! / meta.height!).toBeCloseTo(2, 0);
  });

  it("carries no EXIF, GPS or ICC metadata even when the source has it", async () => {
    const source = await sharp(await synthetic(400, 300))
      .withExif({ IFD0: { Copyright: "synthetic" } })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer();
    expect((await sharp(source).metadata()).exif).toBeDefined();
    const meta = await sharp(Buffer.from((await createImagePlaceholder(source))!.split(",")[1], "base64")).metadata();
    expect(meta.exif).toBeUndefined();
    expect(meta.icc).toBeUndefined();
  });

  it.each([
    ["empty input", new Uint8Array()],
    ["random bytes", new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])],
  ])("falls back to null for %s", async (_name, bytes) => {
    expect(await createImagePlaceholder(bytes)).toBeNull();
  });

  it("falls back to null for a truncated real image", async () => {
    const full = await synthetic(800, 600);
    expect(await createImagePlaceholder(full.subarray(0, Math.floor(full.length / 3)))).toBeNull();
  });

  it("rejects an oversized pixel count without decoding it", async () => {
    const bomb = await sharp({ create: { width: 6000, height: 6000, channels: 3, background: "#fff" } }).png({ compressionLevel: 9 }).toBuffer();
    expect(await createImagePlaceholder(bomb)).toBeNull();
  });

  it.each([
    "data:image/png;base64,AAAA",
    "data:image/svg+xml;base64,AAAA",
    "javascript:alert(1)",
    "data:image/webp;base64,AAAA\" onload=\"x",
    `data:image/webp;base64,${"A".repeat(PLACEHOLDER_MAX_DATA_URL_LENGTH)}`,
    "",
    null,
    42,
  ])("render-side validator rejects %j", (value) => {
    expect(isValidPlaceholder(value)).toBe(false);
  });
});
