export async function normalizeHostedVideoPublication(prisma) {
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(2026091403)`;
    const result = await tx.mediaAsset.updateMany({
      where: {
        kind: "VIDEO",
        OR: [
          { isPublic: true },
          { privacyApprovedAt: { not: null } },
        ],
      },
      data: { isPublic: false, privacyApprovedAt: null },
    });
    return result.count;
  }, { maxWait: 10_000, timeout: 180_000 });
}
