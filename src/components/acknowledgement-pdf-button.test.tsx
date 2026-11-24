import { afterEach, describe, expect, it, vi } from "vitest";
import { AcknowledgementPdfButton } from "./acknowledgement-pdf-button";

type FakeNode = { tag: string; [key: string]: unknown; append: (...nodes: FakeNode[]) => void; remove: () => void; submit: () => void };

function stubDocument() {
  const events: string[] = [];
  const created: FakeNode[] = [];
  const body = { appended: [] as FakeNode[], append(node: FakeNode) { body.appended.push(node); events.push("append"); } };
  vi.stubGlobal("document", {
    body,
    createElement: (tag: string): FakeNode => {
      const node: FakeNode = {
        tag, children: [] as FakeNode[],
        append(...nodes: FakeNode[]) { (node.children as FakeNode[]).push(...nodes); },
        remove() { events.push("remove"); },
        submit() { events.push("submit"); },
      };
      created.push(node);
      return node;
    },
  });
  return { events, created, body };
}

const click = (getToken: () => string | null) => {
  const element = AcknowledgementPdfButton({ reference: "AFD-2026-37563771", getToken }) as unknown as { props: { onClick: () => void; children: string; className: string; type: string } };
  return element;
};

afterEach(() => vi.unstubAllGlobals());

describe("AcknowledgementPdfButton", () => {
  it("renders an ordinary button that is hidden when printing", () => {
    const element = click(() => "token");
    expect(element.props.type).toBe("button");
    expect(element.props.children).toBe("Download PDF");
    expect(element.props.className).toContain("print-button");
  });

  it("posts the reference and token in hidden body fields to the PDF route, in a new tab, with no URL credential", () => {
    const { created, body } = stubDocument();
    click(() => "private-token-value").props.onClick();
    const form = created.find(node => node.tag === "form")!;
    expect(form.method).toBe("post");
    expect(form.action).toBe("/api/donations/acknowledgement/pdf");
    expect(form.target).toBe("_blank");
    expect(form.rel).toBe("noopener");
    expect(String(form.action)).not.toContain("private-token-value");
    const fields = (form.children as FakeNode[]).map(input => [input.type, input.name, input.value]);
    expect(fields).toEqual([["hidden", "reference", "AFD-2026-37563771"], ["hidden", "token", "private-token-value"]]);
    expect(body.appended).toEqual([form]);
  });

  it("submits once and removes the form straight away, so the credential is not left in the page", () => {
    const { events } = stubDocument();
    click(() => "private-token-value").props.onClick();
    expect(events).toEqual(["append", "submit", "remove"]);
  });

  it("does nothing without a credential", () => {
    const { events, created } = stubDocument();
    click(() => null).props.onClick();
    expect(events).toEqual([]);
    expect(created).toEqual([]);
  });

  it("reads the credential only when clicked, never while rendering", () => {
    const getToken = vi.fn(() => "token");
    const element = click(getToken);
    expect(getToken).not.toHaveBeenCalled();
    stubDocument();
    element.props.onClick();
    expect(getToken).toHaveBeenCalledOnce();
  });
});
