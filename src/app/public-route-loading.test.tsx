import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import DonationLoading from "./donate/loading";
import AppealsLoading from "./appeals/loading";
import ImpactLoading from "./impact/loading";
import WorkLoading from "./our-work/loading";
import AppealDetailLoading from "./appeals/[slug]/loading";
import ProgrammeDetailLoading from "./our-work/[slug]/loading";
import StoryDetailLoading from "./stories/[slug]/loading";

describe("Next App Router public streaming route boundaries", () => {
  it.each([
    ["donate", DonationLoading, "approved donation routes"],
    ["appeals", AppealsLoading, "reviewed appeal information"],
    ["impact", ImpactLoading, "published impact records"],
    ["our-work", WorkLoading, "published programmes"],
    ["appeals/[slug]", AppealDetailLoading, "reviewed appeal details"],
    ["our-work/[slug]", ProgrammeDetailLoading, "published programme details"],
    ["stories/[slug]", StoryDetailLoading, "approved story details"],
  ] as const)("wires /%s to one accessible data-specific placeholder", (_route, Component, label) => {
    const html = renderToStaticMarkup(<Component />);
    expect(html).toContain(label);
    expect(html.match(/role="status"/g)).toHaveLength(1);
    expect(html).not.toContain("₹");
    expect(html).not.toContain('action="/api/');
  });
});
