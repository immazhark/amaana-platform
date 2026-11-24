// Live activation switch for Taleem programme sponsorship. It needs BOTH the fund-giving switch and its own: opening
// designated giving never opens sponsorship by itself, and neither switch is set by deploying code. The owner turns
// this on after verification. Read at request time; exact "true" only.
export function isTaleemSponsorshipEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.FUND_GIVING_ENABLED === "true" && env.TALEEM_SPONSORSHIP_ENABLED === "true";
}
