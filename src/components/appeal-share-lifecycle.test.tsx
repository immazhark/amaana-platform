import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

const hooks = vi.hoisted(() => ({
  stateIndex: 0, refIndex: 0, effectIndex: 0,
  values: [] as unknown[], refs: [] as Array<{ current: unknown }>,
  effects: [] as Array<{ deps: unknown[]; cleanup?: () => void }>,
  pending: [] as Array<() => void>,
}));
vi.mock("react", async original => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = hooks.stateIndex++;
    if (!(index in hooks.values)) hooks.values[index] = typeof initial === "function" ? initial() : initial;
    return [hooks.values[index], (next: unknown) => { hooks.values[index] = typeof next === "function" ? next(hooks.values[index]) : next; }];
  },
  useRef: (current: unknown) => {
    const index = hooks.refIndex++;
    return hooks.refs[index] ?? (hooks.refs[index] = { current });
  },
  useEffect: (effect: () => (() => void) | void, deps: unknown[]) => {
    const index = hooks.effectIndex++, previous = hooks.effects[index];
    if (!previous || deps.some((dep, i) => !Object.is(dep, previous.deps[i]))) {
      hooks.pending.push(() => {
        previous?.cleanup?.();
        hooks.effects[index] = { deps, cleanup: effect() ?? undefined };
      });
    }
  },
}));
import { AppealShare } from "./appeal-share";

const original = { title: "Synthetic education appeal", summary: "Synthetic learning materials.", path: "/appeals/synthetic-education" };
const writeText = vi.fn();
beforeEach(() => {
  hooks.values = []; hooks.refs = []; hooks.effects = []; hooks.pending = [];
  writeText.mockReset().mockResolvedValue(undefined);
  vi.stubGlobal("navigator", { clipboard: { writeText } });
});
afterEach(() => {
  hooks.effects.forEach(effect => effect.cleanup?.());
  vi.unstubAllGlobals();
});
function view(props = original) {
  hooks.stateIndex = 0; hooks.refIndex = 0; hooks.effectIndex = 0;
  const root = AppealShare(props);
  const elements: ReactElement<Record<string, unknown>>[] = [];
  const visit = (node: unknown) => {
    if (Array.isArray(node)) { node.forEach(visit); return; }
    if (!node || typeof node !== "object" || !("props" in node)) return;
    const element = node as ReactElement<Record<string, unknown>>;
    elements.push(element); visit(element.props.children);
  };
  visit(root);
  hooks.pending.splice(0).forEach(effect => effect());
  const status = elements.find(element => element.props.role === "status");
  const copy = elements.find(element => element.type === "button" && element.props.children === "Copy link");
  if (!status || !copy || typeof copy.props.onClick !== "function") throw new Error("Expected sharing controls");
  return { feedback: status.props.children, copy: copy.props.onClick as () => void };
}
async function settle() { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); }
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(yes => { resolve = yes; });
  return { promise, resolve };
}
const changed = [
  { ...original, title: "Synthetic changed title" },
  { ...original, summary: "Synthetic changed summary." },
  { ...original, path: "/appeals/synthetic-second" },
];
it.each(changed)("does not announce an old copy after share identity changes: %j", async props => {
  const old = deferred(); writeText.mockReturnValueOnce(old.promise);
  view().copy(); view(props); old.resolve(); await settle();
  expect(view(props).feedback).toBe("");
  expect(writeText).toHaveBeenCalledWith("https://amaanafoundation.org/appeals/synthetic-education");
});
it.each(changed)("clears completed feedback when share identity changes: %j", async props => {
  view().copy(); await settle(); expect(view().feedback).toBe("Link copied.");
  expect(view(props).feedback).toBe("");
});
it("does not resurrect completed feedback when returning to a previous appeal", async () => {
  view().copy(); await settle(); expect(view().feedback).toBe("Link copied.");
  view(changed[2]); expect(view().feedback).toBe("");
});
it("keeps current appeal success after an old appeal copy completes", async () => {
  const old = deferred(); writeText.mockReturnValueOnce(old.promise);
  view().copy(); view(changed[2]).copy(); await settle();
  expect(view(changed[2]).feedback).toBe("Link copied.");
  old.resolve(); await settle(); expect(view(changed[2]).feedback).toBe("Link copied.");
  expect(writeText.mock.calls.map(call => call[0])).toEqual([
    "https://amaanafoundation.org/appeals/synthetic-education",
    "https://amaanafoundation.org/appeals/synthetic-second",
  ]);
});
