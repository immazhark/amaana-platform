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
  if (options.timeoutMs !== undefined) validateMaxBytes(options.timeoutMs);

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

  let timeout: ReturnType<typeof setTimeout> | undefined;
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
  try {
    if (options.timeoutMs === undefined) return await read();
    return await Promise.race([
      read(),
      new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => {
          // Cancellation may itself stall; the deadline must still settle.
          try { void reader.cancel().catch(() => undefined); } catch { /* Best effort. */ }
          reject(new RequestBodyReadTimeoutError());
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
