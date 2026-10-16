import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AdminPrivateDeliveryKindFields } from "./admin-private-delivery-kind-fields";

describe("private delivery type and amount controls", () => {
  it("defaults to in-kind with a blank named amount field for server parsing", () => {
    const html = renderToStaticMarkup(<AdminPrivateDeliveryKindFields/>);
    expect(html).toContain('name="kind"');
    expect(html).toContain('value="IN_KIND" selected=""');
    // The server parser requires the field to exist, even when blank.
    expect(html).toContain('name="amountInr"');
    expect(html).toContain('value=""');
    expect(html).toContain("In-kind goods and services must be recorded without an estimated cash value");
    expect(html).toContain("hidden");
    expect(html).not.toContain('required="" value=""');
  });
  it("uses the precise INR range supported by server-side validation", () => {
    const html = renderToStaticMarkup(<AdminPrivateDeliveryKindFields/>);
    expect(html).toContain('step="0.01"');
    expect(html).toContain('min="0.01"');
    expect(html).toContain('max="9999999999.99"');
    expect(html).toContain('aria-live="polite"');
  });
});
