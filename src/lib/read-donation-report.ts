/** Optional display reports may fail without invalidating the independent record queue. */
export async function readDonationReport<T>(read: () => PromiseLike<T>, unavailable: () => void): Promise<T | null> {
  try {
    return await read();
  } catch {
    unavailable();
    return null;
  }
}
