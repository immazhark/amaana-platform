import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { VolunteerInterestBuilder } from "./volunteer-interest-builder";

describe("volunteer interest experience", () => {
  it("renders selectable skills, an optional availability choice and a truthful email action", () => {
    const html = renderToStaticMarkup(<VolunteerInterestBuilder />);
    expect(html).toContain("<fieldset");
    expect(html).toContain("Technology and website support");
    expect(html).toContain("type=\"checkbox\"");
    expect(html).toContain("General availability");
    expect(html).toContain("mailto:amaanafoundation24@gmail.com?");
    expect(html).toContain("Nothing is sent to Amaana until");
    expect(html).toContain("not advertised vacancies");
    expect(html).not.toContain('action="/api/');
  });
});
