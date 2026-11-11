import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => { throw new Error(`REDIRECT:${url}`); },
}));

import AdminRequestsAlias from "./page";

const props = (search: Record<string, string | string[]>) =>
  ({ searchParams: Promise.resolve(search) });

describe("legacy assistance-queue admin URL", () => {
  it("redirects the missing /admin/requests URL to the real assistance queue", async () => {
    await expect(AdminRequestsAlias(props({}))).rejects.toThrow("REDIRECT:/admin");
  });

  it("preserves only known queue filters during the alias redirect", async () => {
    await expect(AdminRequestsAlias(props({
      status: "APPROVED", view: "tests", page: "3",
    }))).rejects.toThrow("REDIRECT:/admin?status=APPROVED&view=tests&page=3");
  });

  it("does not forward arbitrary URLs, malformed status values or pagination", async () => {
    await expect(AdminRequestsAlias(props({
      status: "https://outside.example/redirect", view: "//outside.example", page: "-1",
    }))).rejects.toThrow("REDIRECT:/admin");
  });

  it("does not treat repeated query parameters as an approved route filter", async () => {
    await expect(AdminRequestsAlias(props({
      status: ["APPROVED"], view: ["tests"], page: ["2"],
    }))).rejects.toThrow("REDIRECT:/admin");
  });
});
