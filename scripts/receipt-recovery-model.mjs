// Offline synthetic decision model only. No proof verification, token issuance or authorization.
const exact = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const integer = value => Number.isSafeInteger(value) && value >= 0;
const opaque = value => typeof value === 'string' && /^synthetic-[a-z0-9-]{1,48}$/.test(value);
const binding = ['donation', 'subject', 'challenge', 'version'];
const validBinding = value => opaque(value.donation) && opaque(value.subject) && opaque(value.challenge) && integer(value.version);
const denied = () => ({ outcome: 'denied' });
// A test bound, not an approved real recovery duration.
const SYNTHETIC_MAX_LIFETIME_MS = 900_000;

export function evaluateRecovery(input) {
  if (!exact(input, ['challenge', 'evidence', 'currentVersion', 'now'])) return denied();
  const { challenge, evidence, currentVersion, now } = input;
  if (!integer(now) || !integer(currentVersion) || currentVersion >= Number.MAX_SAFE_INTEGER ||
      !exact(challenge, [...binding, 'issuedAt', 'expiresAt', 'state']) || !validBinding(challenge) ||
      !exact(evidence, [...binding, 'verifiedAt', 'channelVerified']) || !validBinding(evidence)) return denied();
  if (challenge.state !== 'pending' || evidence.channelVerified !== true ||
      !integer(challenge.issuedAt) || !integer(challenge.expiresAt) || !integer(evidence.verifiedAt) ||
      challenge.expiresAt <= challenge.issuedAt || challenge.expiresAt - challenge.issuedAt > SYNTHETIC_MAX_LIFETIME_MS ||
      evidence.verifiedAt < challenge.issuedAt || evidence.verifiedAt > now || now >= challenge.expiresAt ||
      challenge.version !== currentVersion || !binding.every(key => challenge[key] === evidence[key])) return denied();
  return { outcome: 'candidate', expectedVersion: currentVersion, nextVersion: currentVersion + 1, nextState: 'consumed' };
}
