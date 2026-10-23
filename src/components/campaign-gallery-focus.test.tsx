import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.doUnmock("react");
  vi.doUnmock("next/image");
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function openFixture() {
  const effects: Array<() => (() => void) | undefined> = [];
  let frame: FrameRequestCallback | undefined;
  const triggerFocus = vi.fn();
  const fallbackFocus = vi.fn();
  const trigger = { isConnected: true, focus: triggerFocus };
  const fallback = { isConnected: true, focus: fallbackFocus };
  const firstFocus = vi.fn();
  const lastFocus = vi.fn();
  const first = { focus: firstFocus };
  const last = { focus: lastFocus };
  const dialog = {
    isConnected: true, contains: (node: unknown) => node === first || node === last,
    querySelectorAll: () => ({ length: 2, item: (index: number) => [first, last][index] }),
  };
  const dialogRef: { current: unknown } = { current: dialog };
  const closeFocus = vi.fn();
  const refs = [dialogRef, { current: { focus: closeFocus } }, { current: [trigger, fallback] }];
  let refIndex = 0;
  const body = { style: { overflow: "scroll" } };
  const windowTarget = new EventTarget();

  vi.doMock("react", async importOriginal => ({
    ...await importOriginal<typeof import("react")>(),
    useState: () => ["first", vi.fn()],
    useMemo: (factory: () => unknown) => factory(),
    useCallback: (callback: unknown) => callback,
    useId: () => "focus-fixture",
    useRef: () => refs[refIndex++],
    useEffect: (callback: () => (() => void) | undefined) => { effects.push(callback); },
  }));
  vi.doMock("next/image", () => ({ default: () => null }));
  vi.stubGlobal("document", { body, activeElement: null });
  vi.stubGlobal("window", windowTarget);
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
    frame = callback;
    return 1;
  }));

  const { CampaignMediaGallery } = await import("./campaign-media-gallery");
  CampaignMediaGallery({ items: [
    { id: "first", url: "/media/first.webp", alt: "First photograph" },
    { id: "second", url: "/media/second.webp", alt: "Second photograph" },
  ] });
  const effect = effects[0];
  if (!effect) throw new Error("Expected the gallery lifecycle effect");
  const cleanup = effect();
  if (!cleanup) throw new Error("Expected modal cleanup");
  expect(body.style.overflow).toBe("hidden");
  expect(closeFocus).toHaveBeenCalledOnce();

  return {
    dialogRef, dialog, trigger, fallback, triggerFocus, fallbackFocus, body, firstFocus, lastFocus,
    tab(shiftKey: boolean) {
      const event = new Event("keydown", { cancelable: true });
      Object.defineProperties(event, { key: { value: "Tab" }, shiftKey: { value: shiftKey } });
      windowTarget.dispatchEvent(event);
      return event;
    },
    close() {
      dialog.isConnected = false;
      dialogRef.current = null;
      cleanup();
      expect(body.style.overflow).toBe("scroll");
    },
    flush() {
      if (!frame) throw new Error("Expected queued focus restoration");
      frame(0);
    },
  };
}

describe("gallery delayed focus restoration", () => {
  it("does not move focus out of a gallery dialog reopened before the frame runs", async () => {
    const fixture = await openFixture();
    fixture.close();
    fixture.dialogRef.current = { isConnected: true };
    fixture.flush();
    expect(fixture.triggerFocus).not.toHaveBeenCalled();
    expect(fixture.fallbackFocus).not.toHaveBeenCalled();
  });

  it("restores the triggering thumbnail after an ordinary close", async () => {
    const fixture = await openFixture();
    fixture.close();
    fixture.flush();
    expect(fixture.triggerFocus).toHaveBeenCalledOnce();
    expect(fixture.fallbackFocus).not.toHaveBeenCalled();
  });

  it("uses the remaining thumbnail when the original one was removed", async () => {
    const fixture = await openFixture();
    fixture.close();
    fixture.trigger.isConnected = false;
    fixture.flush();
    expect(fixture.triggerFocus).not.toHaveBeenCalled();
    expect(fixture.fallbackFocus).toHaveBeenCalledOnce();
  });

  it("does not focus disconnected thumbnails after the gallery unmounts", async () => {
    const fixture = await openFixture();
    fixture.close();
    fixture.trigger.isConnected = false;
    fixture.fallback.isConnected = false;
    fixture.flush();
    expect(fixture.triggerFocus).not.toHaveBeenCalled();
    expect(fixture.fallbackFocus).not.toHaveBeenCalled();
  });
});


describe("gallery focus containment", () => {
  it.each([false, true])("recovers focus moved outside the modal, backwards=%s", async backwards => {
    const fixture = await openFixture();
    // Focus can be moved by browser UI, extensions or another script.
    expect(fixture.tab(backwards).defaultPrevented).toBe(true);
    expect(backwards ? fixture.lastFocus : fixture.firstFocus).toHaveBeenCalledOnce();
    expect(backwards ? fixture.firstFocus : fixture.lastFocus).not.toHaveBeenCalled();
  });
});
