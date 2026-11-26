// Unpublished synthetic decision model only. Never use this as send authorization.
const purposes = new Set(['impact-updates', 'monthly-giving']);
const suppressions = new Set(['global-opt-out', 'hard-bounce', 'complaint']);
const opaque = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
const instant = value => Number.isSafeInteger(value) && value >= 0;
const exact = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const denied = reason => ({ candidate: false, reason });

/** Evaluate a complete, ordered, synthetic subject history in O(n) time and O(1) auxiliary space.
 * Inputs are evidence assertions, not authenticated events; a caller must not use this for delivery. */
export function evaluateStewardship(request, events, template) {
  if (!exact(request, ['subject', 'purpose', 'templateVersion', 'asOf']) ||
      !opaque(request.subject) || !purposes.has(request.purpose) ||
      !opaque(request.templateVersion) || !instant(request.asOf) ||
      !Array.isArray(events) || events.length > 10000) return denied('invalid-evidence');
  let sequence = 0;
  let lastAt = 0;
  let state = 'no-consent';
  let suppressed = false;
  for (const event of events) {
    if (!exact(event, ['subject', 'sequence', 'kind', 'purpose', 'at']) ||
        event.subject !== request.subject || event.sequence !== ++sequence ||
        !instant(event.at) || event.at < lastAt || event.at > request.asOf) return denied('invalid-evidence');
    lastAt = event.at;
    if (suppressions.has(event.kind) && event.purpose === null) {
      suppressed = true;
    } else if ((event.kind === 'grant' || event.kind === 'withdraw') && purposes.has(event.purpose)) {
      if (event.purpose === request.purpose) state = event.kind === 'grant' ? 'consent-present' : 'withdrawn';
    } else return denied('invalid-evidence');
  }
  if (suppressed) return denied('suppressed');
  if (state !== 'consent-present') return denied(state);
  if (!exact(template, ['purpose', 'version', 'reviewed']) || template.reviewed !== true ||
      template.purpose !== request.purpose || template.version !== request.templateVersion) return denied('unreviewed-template');
  return { candidate: true, reason: 'consent-present' };
}
