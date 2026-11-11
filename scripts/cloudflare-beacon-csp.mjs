/**
 * AF-R015: read-only contract for the enforced public CSP.
 * Deliberately reject additions rather than relaxing checkout policy to quiet
 * a third-party analytics beacon. This module never changes response headers.
 */
const required = [
  "default-src", "script-src", "script-src-attr", "connect-src",
  "frame-src", "object-src", "frame-ancestors", "base-uri", "form-action",
];

function parseCsp(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return { directives: new Map(), errors: ["Required enforced CSP is missing"] };
  }
  const directives = new Map();
  const errors = [];
  for (const part of value.split(";").map(text => text.trim()).filter(Boolean)) {
    const [name, ...values] = part.split(/\s+/);
    if (!name || !/^[a-z-]+$/.test(name)) {
      errors.push("Malformed CSP directive");
      continue;
    }
    if (directives.has(name)) {
      errors.push("Duplicate CSP directive");
      continue;
    }
    directives.set(name, values);
  }
  return { directives, errors };
}

export function auditCloudflareBeaconCsp(csp) {
  const { directives, errors } = parseCsp(csp);
  if (errors.length && directives.size === 0) return errors;
  for (const directive of required) {
    if (!directives.has(directive)) errors.push("Required CSP directive missing");
  }

  const allowed = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com",
      ...(process.env.NODE_ENV === "development" ? ["'unsafe-eval'"] : [])],
    "script-src-attr": ["'none'"],
    "connect-src": ["'self'", "https://api.razorpay.com"],
    "frame-src": ["https://api.razorpay.com", "https://checkout.razorpay.com"],
    "object-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  };
  for (const [name, permitted] of Object.entries(allowed)) {
    const actual = directives.get(name);
    if (!actual) continue;
    if (actual.some(source => !permitted.includes(source))) {
      const category = name === "script-src" ? "script" :
        name === "connect-src" ? "connect" : "CSP";
      errors.push("Unapproved " + category + " origin or source");
    }
    if (new Set(actual).size !== actual.length) errors.push("Duplicate CSP source");
    for (const source of permitted) {
      // In development the evaluator exception is optional.
      if (source === "'unsafe-eval'") continue;
      if (!actual.includes(source)) {
        errors.push("Required " + name + " source missing");
      }
    }
  }
  return errors;
}
