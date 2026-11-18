// Live activation switch for designated (fund) giving. Off unless FUND_GIVING_ENABLED is exactly "true", so
// deploying the code never opens a new payment flow by itself; the owner turns it on after verification.
export function isFundGivingEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.FUND_GIVING_ENABLED === "true";
}
