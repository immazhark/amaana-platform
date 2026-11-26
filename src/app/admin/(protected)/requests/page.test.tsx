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

describe("legacy queue ordering", () => {
  it("retains an explicitly selected oldest-first order", async () => {
    await expect(AdminRequestsAlias(props({ sort: "oldest", status: "SUBMITTED", page: "2" })))
      .rejects.toThrow("REDIRECT:/admin?status=SUBMITTED&page=2&sort=oldest");
  });
  it.each([{ sort: ["bad"] }, { sort: ["oldest", "newest"] }])("does not forward repeated sort parameters", async ({ sort }) => {
    await expect(AdminRequestsAlias(props({ sort }))).rejects.toThrow("REDIRECT:/admin");
  });
});

describe("legacy queue assignment filter", () => {
  it("retains the supported unassigned filter with the existing queue parameters", async () => {
    await expect(AdminRequestsAlias(props({ status: "SUBMITTED", sort: "oldest", assignment: "unassigned" })))
      .rejects.toThrow("REDIRECT:/admin?status=SUBMITTED&sort=oldest&assignment=unassigned");
  });
  it.each([{ assignment: ["unassigned"] }, { assignment: "synthetic-user-id" }, { assignment: "assigned" }])(
    "does not forward unsupported assignment filters", async ({ assignment }) => {
      await expect(AdminRequestsAlias(props({ assignment }))).rejects.toThrow("REDIRECT:/admin");
    },
  );
});

it("retains the personal assignment filter along with all accepted queue filters", async () => {
  await expect(AdminRequestsAlias(props({ status: "SUBMITTED", view: "tests", page: "3", sort: "oldest", assignment: "mine" })))
    .rejects.toThrow("REDIRECT:/admin?status=SUBMITTED&view=tests&page=3&sort=oldest&assignment=mine");
});
