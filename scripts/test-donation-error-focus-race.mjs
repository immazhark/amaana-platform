import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("donation error focus marker commits only after animation frame begins", () => {
  const source = readFileSync(new URL("../src/components/donation-form.tsx", import.meta.url), "utf8");
  const start = source.indexOf("  useEffect(() => {", source.indexOf("const statusText") >= 0 ? 0 : 0);
  const focusEffect = source.slice(source.indexOf("// Editing a field may change fieldErrors"), source.indexOf("  }, [error, fieldErrors]);"));
  assert.ok(start >= 0);
  const frame = focusEffect.indexOf("const frame = window.requestAnimationFrame(() => {");
  const marker = focusEffect.indexOf("focusedErrorRef.current = error;");
  assert.ok(frame >= 0 && marker > frame, "focus marker must be set inside RAF, not before scheduling");
  assert.ok(focusEffect.includes("return () => window.cancelAnimationFrame(frame)"));
  assert.ok(focusEffect.includes("if (focusedErrorRef.current === error) return;"));
});
