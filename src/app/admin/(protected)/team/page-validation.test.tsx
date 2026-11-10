import { renderToStaticMarkup } from "react-dom/server";
import { expect,it,vi } from "vitest";
const mocks=vi.hoisted(()=>({groups:vi.fn()}));
vi.mock("@/lib/auth",()=>({requirePermission:async()=>({id:"synthetic"})}));
vi.mock("@/lib/prisma",()=>({prisma:{teamGroup:{findMany:mocks.groups}}}));
vi.mock("./actions",()=>({createTeamGroup:async()=>{},updateTeamGroup:async()=>{},reorderTeamGroup:async()=>{},createTeamMember:async()=>{},updateTeamMember:async()=>{},deleteTeamMember:async()=>{},reorderTeamMember:async()=>{}}));
import Page from "./page";
import { TeamMemberFields } from "./team-member-fields";
it.each(["fullName","designation","slug"])("declares the server minimum for member %s",name=>{
 const html=renderToStaticMarkup(<TeamMemberFields groups={[]} />);
 const input=html.match(new RegExp(`<input[^>]*name="${name}"[^>]*>`))?.[0];
 expect(input).toMatch(/minlength="2"/i);
 if(name==="slug")expect(input).not.toMatch(/\brequired(?:=|\s|>)/);
});
it("declares the server minimum on group create and update fields",async()=>{
 mocks.groups.mockResolvedValue([{id:"group",key:"TRUSTEES",title:"Trustees",description:null,updatedAt:new Date("2026-01-01"),members:[]}]);
 const html=renderToStaticMarkup(await Page({searchParams:Promise.resolve({})}));
 for(const name of ["key","title"]){
  const inputs=html.match(new RegExp(`<input[^>]*name="${name}"[^>]*>`,"g"));
  expect(inputs).toHaveLength(2);
  for(const input of inputs??[])expect(input).toMatch(/minlength="2"/i);
 }
});

it("AF-R012 limits team editor group/member projections while keeping editable values", async () => {
  mocks.groups.mockResolvedValue([{
    id: "synthetic-group", key: "TRUSTEES", title: "Trustees",
    description: "Synthetic directory", updatedAt: new Date("2026-11-10T00:00:00Z"),
    members: [{
      id: "synthetic-member", slug: "synthetic-team-slug", groupId: "synthetic-group",
      fullName: "Synthetic Name", designation: "Synthetic Role",
      bio: "Synthetic Biography", linkedinUrl: "https://example.invalid/profile",
      email: "team@example.invalid", photoAlt: "Portrait description",
      photoStorageKey: "synthetic-private-storage-key",
      isPublished: true, updatedAt: new Date("2026-11-10T00:00:00Z"),
    }],
  }]);
  const html = renderToStaticMarkup(await Page({ searchParams: Promise.resolve({}) }));
  expect(mocks.groups).toHaveBeenCalledWith({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    select: {
      id: true, key: true, title: true, description: true, updatedAt: true,
      members: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: {
          id: true, slug: true, groupId: true, fullName: true,
          designation: true, bio: true, linkedinUrl: true,
          email: true, photoAlt: true, photoStorageKey: true,
          isPublished: true, updatedAt: true,
        },
      },
    },
  });
  expect(html).toContain("Synthetic Name");
  expect(html).toContain("Synthetic Role");
  expect(html).toContain("Synthetic Biography");
  expect(html).toContain("synthetic-team-slug");
  expect(html).toContain("Remove the current public photograph");
  expect(html).toContain("team@example.invalid");
  expect(html).toContain("synthetic-group");
});
