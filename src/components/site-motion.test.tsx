import { afterEach, describe, expect, it, vi } from "vitest";

const effects = vi.hoisted(() => [] as Array<() => void | (() => void)>);
vi.mock("react", () => ({ useEffect: (effect: () => void | (() => void)) => effects.push(effect) }));
vi.mock("next/navigation", () => ({ usePathname: () => "/about" }));
vi.mock("./site-scroll", () => ({ useSiteScroll: vi.fn() }));
import { SiteMotion } from "./site-motion";

afterEach(() => { effects.length = 0; vi.unstubAllGlobals(); });

function fixture() {
  const listeners = new Map<string, EventListener>();
  class Control {
    disabled = false;
    isConnected = true;
    style = { translate: "", scale: "", opacity: "" };
    animate = vi.fn((frames: Keyframe[], options: KeyframeAnimationOptions) => ({ frames, options, cancel: vi.fn(), finished: new Promise<void>(() => {}) }));
    closest() { return this; }
    matches(selector: string) { return selector.includes(":disabled") && this.disabled; }
    contains() { return false; }
  }
  class Pointer extends Event {
    constructor(
      type: string,
      readonly button: number,
      readonly pointerType = "mouse",
      readonly pointerId = 1,
    ) { super(type); }
  }
  class Keyboard extends Event {
    readonly repeat = false;
    constructor(type: string, readonly key: string) { super(type); }
  }
  vi.stubGlobal("Element", Control);
  vi.stubGlobal("HTMLElement", Control);
  vi.stubGlobal("Node", Control);
  vi.stubGlobal("PointerEvent", Pointer);
  vi.stubGlobal("KeyboardEvent", Keyboard);
  vi.stubGlobal("IntersectionObserver", class { disconnect() {} observe() {} });
  vi.stubGlobal("getComputedStyle", () => ({ translate: "none", scale: "none" }));
  const windowEvents = Object.assign(new EventTarget(), { matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) });
  vi.stubGlobal("window", windowEvents);
  vi.stubGlobal("document", {
    getElementById: () => null,
    addEventListener: (name: string, handler: EventListener) => listeners.set(name, handler),
    removeEventListener: (name: string) => listeners.delete(name),
  });
  SiteMotion();
  const effect = effects[0];
  if (!effect) throw new Error("Expected site motion effect");
  const cleanup = effect();
  const control = new Control();
  return {
    control,
    leave(type: "focusout" | "pointerout") {
      const event = type === "pointerout" ? new Pointer(type, -1) : new Event(type);
      Object.defineProperty(event, "target", { value: control });
      listeners.get(type)!(event);
    },
    blur() { windowEvents.dispatchEvent(new Event("blur")); },
    send(type: string, button: number, pointerType = "mouse", inside = true, pointerId = 1) {
      const event = new Pointer(type, button, pointerType, pointerId);
      Object.defineProperty(event, "target", { value: inside ? control : new EventTarget() });
      listeners.get(type)!(event);
    },
    key(type: string, key: string) {
      const event = new Keyboard(type, key);
      Object.defineProperty(event, "target", { value: control });
      listeners.get(type)!(event);
    },
    cleanup,
  };
}

describe("site motion press recovery", () => {
  it.each(["focusout", "pointerout"] as const)("settles a disabled action on %s without waiting for release", type => {
    const motion = fixture();
    motion.send("pointerdown", 0);
    motion.control.disabled = true;
    motion.leave(type);
    expect(motion.control.animate).toHaveBeenCalledTimes(2);
    expect(motion.control.animate.mock.calls.at(-1)?.[0]).toEqual(expect.arrayContaining([expect.objectContaining({ scale: "1" })]));
    motion.cleanup?.();
  });

  it("clears a pressed animation when the window loses focus and accepts a later press", () => {
    const motion = fixture();
    motion.send("pointerdown", 0);
    const first = motion.control.animate.mock.results[0]?.value;
    motion.blur();
    expect(first.cancel).toHaveBeenCalledOnce();
    motion.send("pointerdown", 0);
    expect(motion.control.animate).toHaveBeenCalledTimes(2);
    expect(first.cancel).toHaveBeenCalledOnce();
    motion.cleanup?.();
  });

  it("releases a cancelled press regardless of the cancellation button code", () => {
    const motion = fixture();
    motion.send("pointerdown", 0);
    expect(motion.control.animate).toHaveBeenCalledTimes(1);
    motion.send("pointercancel", -1);
    expect(motion.control.animate).toHaveBeenCalledTimes(2);
    expect(motion.control.animate.mock.calls.at(-1)?.[0]).toEqual(expect.arrayContaining([expect.objectContaining({ scale: "1" })]));
    motion.cleanup?.();
  });

  it("releases a control that becomes disabled during a press", () => {
    const motion = fixture();
    motion.send("pointerdown", 0);
    motion.control.disabled = true;
    motion.send("pointerup", 0);
    expect(motion.control.animate).toHaveBeenCalledTimes(2);
    motion.cleanup?.();
  });

  it.each(["pointerup", "pointercancel"] as const)(
    "releases a touch action when %s arrives outside the pressed control",
    type => {
      const motion = fixture();
      motion.send("pointerdown", 0, "touch");
      expect(motion.control.animate).toHaveBeenCalledTimes(1);
      // Touch pointerout is deliberately ignored: a drag is not a hover exit.
      motion.send("pointerout", -1, "touch");
      expect(motion.control.animate).toHaveBeenCalledTimes(1);
      motion.send(type, -1, "touch", false);
      expect(motion.control.animate).toHaveBeenCalledTimes(2);
      expect(motion.control.animate.mock.calls.at(-1)?.[0])
        .toEqual(expect.arrayContaining([expect.objectContaining({ scale: "1" })]));
      motion.cleanup?.();
    },
  );

  it("does not release an active touch because a different pointer ended", () => {
    const motion = fixture();
    motion.send("pointerdown", 0, "touch", true, 7);
    motion.send("pointerup", -1, "touch", false, 8);
    expect(motion.control.animate).toHaveBeenCalledTimes(1);
    motion.send("pointerup", -1, "touch", false, 7);
    expect(motion.control.animate).toHaveBeenCalledTimes(2);
    motion.cleanup?.();
  });

  it("does not start a press from secondary buttons or disabled controls", () => {
    const motion = fixture();
    motion.send("pointerdown", 2);
    motion.control.disabled = true;
    motion.send("pointerdown", 0);
    expect(motion.control.animate).not.toHaveBeenCalled();
    motion.cleanup?.();
  });

  it.each(["Enter", " "])("releases %j after the action becomes disabled", key => {
    const motion = fixture();
    motion.key("keydown", key);
    expect(motion.control.animate).toHaveBeenCalledTimes(1);
    motion.control.disabled = true;
    motion.key("keyup", key);
    expect(motion.control.animate).toHaveBeenCalledTimes(2);
    motion.cleanup?.();
  });
});
