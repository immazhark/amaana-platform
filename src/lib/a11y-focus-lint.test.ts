import { readFileSync } from "node:fs";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

describe("AF-R069 public JSX focus lint governance", () => {
  it("pins no-autofocus as an explicit error and rejects forced focus", async () => {
    // A transitive framework preset must not silently relax this policy.
    const configSource = readFileSync("eslint.config.mjs", "utf8");
    expect(configSource).toMatch(/"jsx-a11y\/no-autofocus"\s*:\s*"error"/);

    const eslint = new ESLint();
    const filePath = "src/components/__synthetic_focus_lint_contract__.tsx";
    const effective = await eslint.calculateConfigForFile(filePath);
    expect(effective?.rules?.["jsx-a11y/no-autofocus"]?.[0]).toBe(2);

    const blocked = await eslint.lintText(
      "export function ForcedFocus() { return <input autoFocus aria-label='Example' />; }",
      { filePath },
    );
    expect(blocked[0]?.messages.filter(message =>
      message.ruleId === "jsx-a11y/no-autofocus" && message.severity === 2,
    )).toHaveLength(1);

    const permitted = await eslint.lintText(
      "export function UserControlled() { return <input aria-label='Example' />; }",
      { filePath },
    );
    expect(permitted[0]?.messages.some(message =>
      message.ruleId === "jsx-a11y/no-autofocus",
    )).toBe(false);
  });
});
