import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INTAKE_PAUSED_MESSAGE } from "@/lib/assistance-policy";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { assistanceIntakeSetting: { findUnique: mocks.findUnique } } }));
vi.mock("@/components/assistance-form", () => ({ AssistanceForm: () => <form data-testid="synthetic-assistance-form" /> }));

import RequestAssistancePage, { dynamic } from "./page";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("ASSISTANCE_INTAKE_PAUSED", "");
  mocks.findUnique.mockResolvedValue(null);
});
afterEach(() => vi.unstubAllEnvs());

const render = async () => renderToStaticMarkup(await RequestAssistancePage());

describe("public assistance intake entry", () => {
  it("shows the form and both navigation actions when intake is open", async () => {
    const html = await render();
    expect(html).toContain('data-testid="synthetic-assistance-form"');
    expect(html).toContain('href="#request-form"');
    expect(html).toContain('href="/request-assistance/status"');
    expect(html).not.toContain(INTAKE_PAUSED_MESSAGE);
    expect(mocks.findUnique).toHaveBeenCalledExactlyOnceWith({ where: { id: "singleton" }, select: { paused: true } });
  });

  it("uses the stored pause state before rendering any applicant fields", async () => {
    mocks.findUnique.mockResolvedValue({ paused: true });
    const html = await render();
    expect(html).toContain(INTAKE_PAUSED_MESSAGE);
    expect(html).toContain("New assistance requests are paused");
    expect(html).toContain('href="/request-assistance/status"');
    expect(html).not.toContain('data-testid="synthetic-assistance-form"');
    expect(html).not.toContain('href="#request-form"');
    expect(html).not.toContain('id="request-form"');
  });

  it("respects the deployment pause override without a database read", async () => {
    vi.stubEnv("ASSISTANCE_INTAKE_PAUSED", "true");
    const html = await render();
    expect(html).toContain(INTAKE_PAUSED_MESSAGE);
    expect(html).not.toContain('data-testid="synthetic-assistance-form"');
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("reads fresh state on requests so an explicit reopen restores the form", async () => {
    expect(dynamic).toBe("force-dynamic");
    mocks.findUnique.mockResolvedValueOnce({ paused: true }).mockResolvedValueOnce({ paused: false });
    expect(await render()).not.toContain('data-testid="synthetic-assistance-form"');
    expect(await render()).toContain('data-testid="synthetic-assistance-form"');
    expect(mocks.findUnique).toHaveBeenCalledTimes(2);
  });

  it("fails closed on a status read failure rather than rendering an unverified open form", async () => {
    mocks.findUnique.mockRejectedValue(new Error("synthetic read failure"));
    await expect(render()).rejects.toThrow("synthetic read failure");
  });
});
