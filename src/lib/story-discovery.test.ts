import { expect, it } from "vitest";
import { publishedStoryProgrammeContext, selectStoryDiscovery } from "./story-discovery";
it("does not crash or expose an unpublished programme when a published initiative projection lacks its nested cause", () => {
  const missingRelation = {
    title: "Reviewed story",
    summary: "Public narrative",
    initiative: { status: "PUBLISHED", cause: null },
    cause: { title: "Internal unpublished programme", status: "DRAFT" },
  } as unknown as Parameters<typeof publishedStoryProgrammeContext>[0];

  expect(publishedStoryProgrammeContext(missingRelation)).toBeNull();
  const selected = selectStoryDiscovery([missingRelation], {});
  expect(selected.programmes).toEqual([]);
  expect(selected.results).toEqual([missingRelation]);
  expect(JSON.stringify(selected.programmes)).not.toContain("Internal unpublished");
});

it("uses a reviewed direct cause when a published initiative projection has no nested cause", () => {
  const missingRelation = {
    title: "Reviewed story",
    summary: "Public narrative",
    initiative: { status: "PUBLISHED", cause: null },
    cause: { title: "Reviewed education", status: "PUBLISHED" },
  } as unknown as Parameters<typeof publishedStoryProgrammeContext>[0];
  expect(publishedStoryProgrammeContext(missingRelation)).toBe("Reviewed education");
  expect(selectStoryDiscovery([missingRelation], { programme: "Reviewed education" }))
    .toMatchObject({ invalid: false, count: 1, programmes: ["Reviewed education"] });
});

it("combines public context and search with bounded pagination", () => {
  const records = Array.from({length: 25}, (_, i) => ({id:String(i),title:`Winter ${i}`,summary:"Community relief",cause:{title:"Relief",status:"PUBLISHED"}}));
  expect(selectStoryDiscovery(records,{q:"community",programme:"Relief",page:"2"})).toMatchObject({page:2,totalPages:3,count:25});
  expect(selectStoryDiscovery(records,{page:"999"}).results).toHaveLength(1);
  expect(selectStoryDiscovery(records,{q:["winter"]}).invalid).toBe(true);
  expect(selectStoryDiscovery(records,{q:"missing"}).count).toBe(0);
});
it("never exposes unpublished context as a filter option", () => {
 const records=[{title:"Public story",summary:"Reviewed",cause:{title:"Private programme",status:"DRAFT"}}];
 expect(selectStoryDiscovery(records,{}).programmes).toEqual([]);
 expect(selectStoryDiscovery(records,{programme:"Private programme"}).invalid).toBe(true);
});
it("filters initiative-linked stories through published parent programmes", () => {
 const records=[{title:"Reviewed story",summary:"Public",cause:null,initiative:{status:"PUBLISHED",cause:{title:"Education",status:"PUBLISHED"}}}];
 expect(selectStoryDiscovery(records,{programme:"Education"}).count).toBe(1);
 expect(selectStoryDiscovery(records,{}).programmes).toEqual(["Education"]);
});


it("excludes whitespace-only published programme titles without hiding their stories", () => {
 const records = [
  {title:"Blank direct",summary:"Public",cause:{status:"PUBLISHED",title:"  "}},
  {title:"Valid direct",summary:"Public",cause:{status:"PUBLISHED",title:"Education"}},
 ];
 const result = selectStoryDiscovery(records,{});
 expect(result.programmes).toEqual(["Education"]);
 expect(result.results).toEqual(records);
 expect(selectStoryDiscovery(records,{programme:"  "})).toMatchObject({invalid:true,count:0});
});
it("uses a valid published direct cause when a published initiative programme title is blank", () => {
 const story = {title:"Reviewed story",summary:"Public",cause:{status:"PUBLISHED",title:"Relief"},initiative:{status:"PUBLISHED",cause:{status:"PUBLISHED",title:" \t "}}};
 const result = selectStoryDiscovery([story],{programme:"Relief"});
 expect(result.programmes).toEqual(["Relief"]);
 expect(result.results[0]).toBe(story);
 expect(result.invalid).toBe(false);
});
it("preserves original published spelling and preferred initiative context", () => {
 const story={title:"Reviewed story",summary:"Public",cause:{status:"PUBLISHED",title:"Direct"},initiative:{status:"PUBLISHED",cause:{status:"PUBLISHED",title:" Education "}}};
 const result=selectStoryDiscovery([story],{programme:" Education "});
 expect(result.programmes).toEqual([" Education "]);
 expect(result.results).toEqual([story]);
});
it("never falls back to unpublished direct cause after an unusable initiative title", () => {
 const story={title:"Reviewed story",summary:"Public",cause:{status:"DRAFT",title:"Private"},initiative:{status:"PUBLISHED",cause:{status:"PUBLISHED",title:"   "}}};
 const result=selectStoryDiscovery([story],{});
 expect(result.programmes).toEqual([]);
 expect(selectStoryDiscovery([story],{programme:"Private"}).invalid).toBe(true);
});

it("uses the same published parent programme for filtering and story labels", () => {
  const story = { title: "Reviewed kits", summary: "Public", cause: null,
    initiative: { status: "PUBLISHED", cause: { title: "Education", status: "PUBLISHED" } } };
  expect(selectStoryDiscovery([story], { programme: "Education" })).toMatchObject({ invalid: false, count: 1 });
  expect(publishedStoryProgrammeContext(story)).toBe("Education");
});

it("falls back to a published direct cause when a linked published programme title is blank", () => {
  const story = { title: "Reviewed relief", summary: "Public",
    cause: { title: "Relief", status: "PUBLISHED" },
    initiative: { status: "PUBLISHED", cause: { title: "  ", status: "PUBLISHED" } } };
  expect(selectStoryDiscovery([story], { programme: "Relief" }).count).toBe(1);
  expect(publishedStoryProgrammeContext(story)).toBe("Relief");
});

it("never exposes private programme context even through a visible story label", () => {
  const story = { title: "Public story", summary: "Public",
    cause: { title: "Unpublished cause", status: "DRAFT" },
    initiative: { status: "DRAFT", cause: { title: "Unpublished initiative", status: "PUBLISHED" } } };
  expect(publishedStoryProgrammeContext(story)).toBeNull();
  expect(selectStoryDiscovery([story], {}).programmes).toEqual([]);
});

it("finds approved stories with irregular internal whitespace without exposing private cause names", () => {
  const story = { title: "School   field", summary: "Reviewed\t note",
    cause: { title: "Internal programme", status: "DRAFT" } };
  const result = selectStoryDiscovery([story], { q: "school field" });
  expect(result).toMatchObject({ invalid: false, count: 1 });
  expect(result.programmes).toEqual([]);
  expect(result.results).toEqual([story]);
});
