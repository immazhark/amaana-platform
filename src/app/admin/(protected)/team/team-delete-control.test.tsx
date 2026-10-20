import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TeamDeleteControl } from "./team-delete-control";

const action = async (formData: FormData) => { void formData; };

function renderMember(designation: string, id: string) {
  return renderToStaticMarkup(
    <TeamDeleteControl
      member={{
        id,
        fullName: "Mohammed Ismail Khan",
        designation,
        updatedAt: new Date("2026-10-20T10:00:00.000Z"),
      }}
      action={action}
    />,
  );
}

describe("Team member removal dialogue", () => {
  it("identifies same-name members by role in trigger and confirmation", () => {
    const finance = renderMember("Chartered Accountant", "finance_member");
    const developer = renderMember("Web Developer", "web_member");

    expect(finance).toContain("Remove member: Mohammed Ismail Khan, Chartered Accountant");
    expect(developer).toContain("Remove member: Mohammed Ismail Khan, Web Developer");
    expect(finance).toContain("Remove Mohammed Ismail Khan, Chartered Accountant from the directory?");
    expect(developer).toContain("Remove Mohammed Ismail Khan, Web Developer from the directory?");
  });

  it("describes actual public removal and retained audit record without claiming physical deletion", () => {
    const html = renderMember("Web Developer", "web_member");
    expect(html).toContain("A limited internal record remains for audit integrity.");
    expect(html).toContain("Remove from directory");
    expect(html).not.toMatch(/permanent(?:ly)?/i);
    expect(html).toContain("name=\"confirm\"");
    expect(html).toContain("pattern=\"DELETE\"");
    expect(html).toContain("name=\"expectedUpdatedAt\"");
  });
});
