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
