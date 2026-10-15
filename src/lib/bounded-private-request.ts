/** Bound transport AND body decoding, even when a transport ignores abort.
 * Cancellation only ends this browser's wait; it cannot undo a server write. */
export async function boundedPrivateRequest<T>(
  operation: (signal: AbortSignal) => Promise<T>, timeoutMs: number, lifetime?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  let rejectAbort: (error: Error) => void;
  const cancelled = new Promise<never>((_resolve, reject) => { rejectAbort = reject; });
  const onAbort = () => rejectAbort(new Error("Private request cancelled or timed out"));
  controller.signal.addEventListener("abort", onAbort, { once: true });
  lifetime?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, timeoutMs);
  if (lifetime?.aborted) abort();
  try {
    return await Promise.race([cancelled, Promise.resolve().then(() => {
      if (controller.signal.aborted) throw new Error("Private request cancelled");
      return operation(controller.signal);
    })]);
  } finally {
    clearTimeout(timer);
    lifetime?.removeEventListener("abort", abort);
    controller.signal.removeEventListener("abort", onAbort);
  }
}
