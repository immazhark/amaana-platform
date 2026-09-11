const trackablePublicPath = /^\/(?:$|about$|contact$|get-involved$|governance$|how-we-verify$|impact$|transparency$|compliance$|privacy$|terms$|donation-policy$|refund-policy$|appeals(?:\/[a-z0-9-]+)?$|our-work(?:\/[a-z0-9-]+)?$|stories(?:\/[a-z0-9-]+)?$|faith-and-reflections(?:\/[a-z0-9-]+)?$)/;

export function isTrackablePublicPath(pathname: string) {
  return pathname.length <= 200 && trackablePublicPath.test(pathname);
}
