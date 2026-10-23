import { describe, expect, it } from "vitest";
import { ADMIN_PAGE_SIZE, getAdminPagination, parseAdminPage } from "./admin-pagination";

describe("admin pagination", () => {
  it("parses only positive integer pages", () => {
    expect(parseAdminPage(undefined)).toBe(1);
    expect(parseAdminPage("1")).toBe(1);
    expect(parseAdminPage("3")).toBe(3);
    expect(parseAdminPage("0")).toBe(1);
    expect(parseAdminPage("-2")).toBe(1);
    expect(parseAdminPage("not-a-page")).toBe(1);
  });

  it.each(["3junk", "3.5", "3e2", " 3", "3 ", "+3", "03", "Infinity", "9007199254740992"])("rejects ambiguous page %s", value => {
    expect(parseAdminPage(value)).toBe(1);
    expect(getAdminPagination(151, parseAdminPage(value))).toMatchObject({ page: 1, skip: 0 });
  });

  it.each([NaN, Infinity, -Infinity, 2.5, 0, -2])("normalizes invalid numeric page %s before calculating offsets", page => {
    expect(getAdminPagination(151, page)).toMatchObject({ page: 1, skip: 0, hasPrevious: false });
  });

  it.each([{ value: ["3"] }, { value: ["3", "4"] }])("rejects array-valued pages $value", ({ value }) => {
    expect(parseAdminPage(value)).toBe(1);
  });

  it("bounds requested pages and calculates offsets", () => {
    expect(getAdminPagination(0, 9)).toEqual({
      page: 1,
      pageSize: ADMIN_PAGE_SIZE,
      totalItems: 0,
      totalPages: 1,
      skip: 0,
      hasPrevious: false,
      hasNext: false,
    });

    expect(getAdminPagination(121, 2)).toEqual({
      page: 2,
      pageSize: ADMIN_PAGE_SIZE,
      totalItems: 121,
      totalPages: 3,
      skip: 50,
      hasPrevious: true,
      hasNext: true,
    });

    expect(getAdminPagination(121, 99)).toMatchObject({
      page: 3,
      totalPages: 3,
      skip: 100,
      hasPrevious: true,
      hasNext: false,
    });
  });
});
