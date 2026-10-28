const credentialMarker = /(?:^|_)(?:SECRET|PASSWORD|PRIVATE_KEY|ACCESS_KEY|API_TOKEN|AUTH_TOKEN|CREDENTIALS?)(?:_|$)/;
const storageMarker = /(?:^|_)(?:S3|R2|AWS|MEDIA|STORAGE)(?:_|$)/;
const keyMarker = /(?:^|_)(?:KEY|TOKEN)(?:_|$)/;

export function rejectPublicCredentialNames(env) {
  return Object.keys(env)
    .filter((name) => {
      if (!/^NEXT_PUBLIC_[A-Z][A-Z0-9_]*$/.test(name)) return false;
      const suffix = name.slice("NEXT_PUBLIC_".length);
      return credentialMarker.test(suffix) || (storageMarker.test(suffix) && keyMarker.test(suffix));
    })
    .sort()
    .map((name) => `${name} must not expose credential settings through NEXT_PUBLIC_.`);
}
