import { describe, expect, it } from "vitest";
import { readTextBodyWithLimit, RequestBodyTooLargeError } from "./bounded-request-body";

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

describe("readTextBodyWithLimit", () => {
  it("reads a body smaller than the byte limit", async () => {
    const request = new Request("https://amaanafoundation.org/", {
      method: "POST",
      body: '{"event":"payment.captured"}',
    });

    await expect(readTextBodyWithLimit(request, 1024)).resolves.toBe('{"event":"payment.captured"}');
  });

  it("accepts a body exactly at the byte limit", async () => {
    const request = new Request("https://amaanafoundation.org/", { method: "POST", body: "123456" });
    await expect(readTextBodyWithLimit(request, 6)).resolves.toBe("123456");
  });

  it("rejects immediately when a valid content-length exceeds the limit", async () => {
    const request = new Request("https://amaanafoundation.org/", {
      method: "POST",
      headers: { "content-length": "2048" },
      body: "small",
    });

    await expect(readTextBodyWithLimit(request, 1024)).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });

  it("rejects a chunked body when streamed bytes exceed the limit", async () => {
    const encoder = new TextEncoder();
    const request = streamedRequest([encoder.encode("1234"), encoder.encode("5678")]);

    await expect(readTextBodyWithLimit(request, 7)).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });

  it("counts UTF-8 bytes rather than JavaScript characters", async () => {
    const body = "₹₹";
    const request = new Request("https://amaanafoundation.org/", { method: "POST", body });

    expect(new TextEncoder().encode(body)).toHaveLength(6);
    await expect(readTextBodyWithLimit(request, 5)).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });

  it("does not trust malformed content-length and still enforces the streamed limit", async () => {
    const encoder = new TextEncoder();
    const request = streamedRequest([encoder.encode("12345678")], { "content-length": "not-a-number" });

    await expect(readTextBodyWithLimit(request, 7)).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });
});
