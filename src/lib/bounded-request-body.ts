export class RequestBodyTooLargeError extends Error {
  constructor(public readonly maxBytes: number) {
    super(`Request body exceeds ${maxBytes} bytes`);
    this.name = "RequestBodyTooLargeError";
  }
}

export class RequestBodyReadTimeoutError extends Error {
  constructor() {
    super("Request body read timed out");
    this.name = "RequestBodyReadTimeoutError";
  }
}

type BodyReadOptions = { timeoutMs?: number };

function validateMaxBytes(maxBytes: number) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) {
    throw new RangeError("maxBytes must be a positive safe integer");
  }
}

export async function readBodyBytesWithLimit(request: Request, maxBytes: number, options: BodyReadOptions = {}) {
  validateMaxBytes(maxBytes);
  if (options.timeoutMs !== undefined && (!Number.isSafeInteger(options.timeoutMs) || options.timeoutMs <= 0 || options.timeoutMs > 2_147_483_647)) {
    throw new RangeError("timeoutMs must be an integer between 1 and 2147483647");
  }

  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const parsed = Number(declaredLength);
    if (Number.isSafeInteger(parsed) && parsed >= 0 && parsed > maxBytes) {
      throw new RequestBodyTooLargeError(maxBytes);
    }
  }

  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  const read = async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        // Initiate cleanup without awaiting a hostile/broken source. Its cancel
        // promise may never settle, but the caller must still receive the 413.
        try {
          void reader.cancel().catch(() => undefined);
        } catch {
          // Preserve RequestBodyTooLargeError for the calling HTTP boundary.
        }
        throw new RequestBodyTooLargeError(maxBytes);
      }
      chunks.push(value);
    }

    const body = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return body;
  };

  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    if (options.timeoutMs === undefined) return await read();
    return await Promise.race([
      read(),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          // Reject first: cleanup must not turn a partial read into success.
          reject(new RequestBodyReadTimeoutError());
          try { void reader.cancel().catch(() => undefined); } catch { /* Best effort. */ }
        }, options.timeoutMs);
      }),
    ]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
    reader.releaseLock();
  }
}

export async function readTextBodyWithLimit(request: Request, maxBytes: number, options: BodyReadOptions = {}) {
  return new TextDecoder().decode(await readBodyBytesWithLimit(request, maxBytes, options));
}
