import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { parseManagedImageWidth, managedImageSrcSet } from "./managed-image-variants";
import { renderManagedImage, withManagedImageSlot } from "./managed-image-render";

const path = "/media/2026/123e4567-e89b-12d3-a456-426614174000.webp";

describe("bounded revocable image renditions", () => {
  it("allows only fixed widths and canonical managed paths", () => {
    expect(parseManagedImageWidth("?w=640")).toBe(640);
    for (const search of ["?w=641", "?w=640&w=384", "?w=0640", "?w=640&x=1", "?w=%36%34%30"]) expect(parseManagedImageWidth(search)).toBeNull();
    expect(parseManagedImageWidth("")).toBeUndefined();
    expect(managedImageSrcSet(path, 2400, 1600)).toBe([384, 640, 960, 1280].map(w => `${path}?w=${w} ${w}w`).join(", "));
    expect(managedImageSrcSet(path, 300, 200)).toBeUndefined();
    expect(managedImageSrcSet(path, 8000, 8000)).toBeUndefined();
    expect(managedImageSrcSet(path + "?x=1", 2400, 1600)).toBeUndefined();
    expect(managedImageSrcSet(path, null, null)).toBeUndefined();
  });

  it("resizes an actual raster, strips metadata and refuses invalid input", async () => {
    const input = await sharp({ create: { width: 2400, height: 1600, channels: 3, background: "#466faa" } }).jpeg().withMetadata({ orientation: 1 }).toBuffer();
    const output = await renderManagedImage(input, "image/jpeg", 640);
    const metadata = await sharp(output).metadata();
    expect(metadata).toMatchObject({ format: "webp", width: 640, height: 427 });
    expect(metadata.exif).toBeUndefined();
    await expect(renderManagedImage(input, "image/png", 640)).rejects.toThrow();
    await expect(renderManagedImage(Buffer.from("not raster"), "image/jpeg", 640)).rejects.toThrow();
    await expect(renderManagedImage(input, "image/jpeg", 641)).rejects.toThrow();
  });

  it("bounds active and queued work and refuses overflow", async () => {
    let active = 0;
    let max = 0;
    const releases: Array<() => void> = [];
    const jobs = Array.from({ length: 10 }, () => withManagedImageSlot(async () => {
      active++;
      max = Math.max(max, active);
      await new Promise<void>(resolve => releases.push(resolve));
      active--;
      return true;
    }));
    await expect(withManagedImageSlot(async () => { throw new Error("must not execute"); })).rejects.toThrow("busy");
    for (let index = 0; index < 10; index++) {
      while (!releases.length) await new Promise<void>(resolve => setImmediate(resolve));
      releases.shift()!();
      await new Promise<void>(resolve => setImmediate(resolve));
    }
    expect(await Promise.all(jobs)).toHaveLength(10);
    expect(max).toBe(2);
  });
});
