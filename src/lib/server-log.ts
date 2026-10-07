type SafeLogValue = string | number | boolean | null | undefined;
type SafeLogContext = Readonly<Record<string, SafeLogValue>>;

function normalizeValue(value: SafeLogValue) {
  if (typeof value !== "string") return value ?? null;
  return value.replace(/[\r\n\t]+/g, " ").slice(0, 160);
}

export function logServerError(event: string, context: SafeLogContext = {}) {
  const safeContext = Object.fromEntries(
    Object.entries(context).map(([key, value]) => [key, normalizeValue(value)]),
  );

  console.error(JSON.stringify({
    level: "error",
    event,
    ...safeContext,
  }));
}
