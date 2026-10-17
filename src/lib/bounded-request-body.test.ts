import { describe, expect, it, vi } from "vitest";
import { readBodyBytesWithLimit, readTextBodyWithLimit, RequestBodyTooLargeError } from "./bounded-request-body";

function streamedRequest(chunks: Uint8Array[], headers?: HeadersInit) {
  return new Request("https://amaanafoundation.org/api/webhooks/razorpay", {
    method: "POST",
    headers,
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk);
        controller.close();
      },
    }),
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

describe("bounded request bodies", () => {
  it("returns raw bytes without changing their contents", async () => {
    const request = new Request("https://amaanafoundation.org/", { method: "POST", body: "abc₹" });
    const bytes = await readBodyBytesWithLimit(request, 16);
    expect(new TextDecoder().decode(bytes)).toBe("abc₹");
  });

  it("reads a text body smaller than the byte limit", async () => {
    const request = new Request("https://amaanafoundation.org/", {
      method: "POST",
      body: '{"event":"payment.captured"}',
    });

    await expect(readTextBodyWithLimit(request, 1024)).resolves.toBe('{"event":"payment.captured"}');
  });

  it("accepts a body exactly at the byte limit", async () => {
    const request = new Request("https://amaanafoundation.org/", { method: "POST", body: "123456" });
    await expect(readBodyBytesWithLimit(request, 6)).resolves.toHaveLength(6);
  });

  it("rejects immediately when a valid content-length exceeds the limit", async () => {
    const request = new Request("https://amaanafoundation.org/", {
      method: "POST",
      headers: { "content-length": "2048" },
      body: "small",
    });

    await expect(readBodyBytesWithLimit(request, 1024)).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });

  it("rejects a chunked body when streamed bytes exceed the limit", async () => {
    const encoder = new TextEncoder();
    const request = streamedRequest([encoder.encode("1234"), encoder.encode("5678")]);

    await expect(readBodyBytesWithLimit(request, 7)).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });

  it("preserves the size-limit error when the request stream refuses cancellation", async () => {
    const request = new Request("https://amaanafoundation.org/api/webhooks/razorpay", {
      method: "POST",
      body: new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode("12345678"));
        },
        cancel() {
          throw new Error("stream cancellation failed");
        },
      }),
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    await expect(readBodyBytesWithLimit(request, 7)).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });

  it("rejects an oversized body even when stream cancellation never settles", async () => {
    vi.useFakeTimers();
    try {
      const request = new Request("https://amaanafoundation.org/api/donations/order", {
        method: "POST",
        body: new ReadableStream<Uint8Array>({
          start(controller) { controller.enqueue(new Uint8Array(8)); },
          cancel() { return new Promise<void>(() => {}); },
        }),
        duplex: "half",
      } as RequestInit & { duplex: "half" });
      const outcome = Promise.race([
        readBodyBytesWithLimit(request, 7).then(() => "accepted", error => error),
        new Promise<string>(resolve => setTimeout(() => resolve("rejection stalled"), 100)),
      ]);
      await vi.advanceTimersByTimeAsync(100);
      expect(await outcome).toBeInstanceOf(RequestBodyTooLargeError);
    } finally {
      vi.useRealTimers();
    }
  });

  it("counts UTF-8 bytes rather than JavaScript characters", async () => {
    const body = "₹₹";
    const request = new Request("https://amaanafoundation.org/", { method: "POST", body });

    expect(new TextEncoder().encode(body)).toHaveLength(6);
    await expect(readBodyBytesWithLimit(request, 5)).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });

  it("does not trust malformed content-length and still enforces the streamed limit", async () => {
    const encoder = new TextEncoder();
    const request = streamedRequest([encoder.encode("12345678")], { "content-length": "not-a-number" });

    await expect(readBodyBytesWithLimit(request, 7)).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });
});


describe("absolute request body deadlines", () => {
  it("rejects a stalled stream even if cancellation never settles", async () => {
    vi.useFakeTimers();
    try {
      const request = new Request("https://amaanafoundation.org/api/synthetic", {
        method: "POST", body: new ReadableStream({ cancel: () => new Promise<void>(() => {}) }), duplex: "half",
      } as RequestInit & { duplex: "half" });
      let outcome: unknown = "pending";
      void readTextBodyWithLimit(request, 1024, { timeoutMs: 50 }).then(value => { outcome = value; }, error => { outcome = error; });
      await vi.advanceTimersByTimeAsync(50);
      expect(outcome).toMatchObject({ name: "RequestBodyReadTimeoutError" });
      expect(request.body?.locked).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });

  it("does not extend the total deadline when chunks keep arriving", async () => {
    vi.useFakeTimers();
    try {
      let controller!: ReadableStreamDefaultController<Uint8Array>;
      const request = new Request("https://amaanafoundation.org/api/synthetic", {
        method: "POST", body: new ReadableStream<Uint8Array>({ start(value) { controller = value; } }), duplex: "half",
      } as RequestInit & { duplex: "half" });
      let outcome: unknown = "pending";
      void readBodyBytesWithLimit(request, 1024, { timeoutMs: 50 }).then(value => { outcome = value; }, error => { outcome = error; });
      for (let i = 0; i < 4; i++) {
        await vi.advanceTimersByTimeAsync(10);
        controller.enqueue(new Uint8Array([65]));
      }
      await vi.advanceTimersByTimeAsync(10);
      expect(outcome).toMatchObject({ name: "RequestBodyReadTimeoutError" });
    } finally { vi.useRealTimers(); }
  });

  it("clears its timer after a normal read", async () => {
    vi.useFakeTimers();
    try {
      const request = new Request("https://amaanafoundation.org/", { method: "POST", body: "abc₹" });
      await expect(readTextBodyWithLimit(request, 6, { timeoutMs: 50 })).resolves.toBe("abc₹");
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });

  it.each([0, -1, NaN, Infinity, 1.5, 2_147_483_648])("rejects invalid timeout %s", async timeoutMs => {
    const request = new Request("https://amaanafoundation.org/", { method: "POST", body: "abc" });
    await expect(readTextBodyWithLimit(request, 1024, { timeoutMs })).rejects.toThrow(RangeError);
  });
});
