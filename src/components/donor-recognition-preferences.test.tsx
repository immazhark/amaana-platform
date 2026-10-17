import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DonorRecognitionPreferences } from "./donor-recognition-preferences";

describe("private receipt recognition consent control", () => {
  it("does not reveal receipt credentials or auto-publish on server rendering", () => {
    const markup = renderToStaticMarkup(<DonorRecognitionPreferences reference="AF-PRIVATE" getToken={() => "private-secret"}/>);
    expect(markup).toContain("No name is published merely because you gave");
    expect(markup).toContain("Checking recognition preferences");
    expect(markup).not.toContain("private-secret");
    expect(markup).not.toContain('href="/api/donations/recognition');
  });
});
