import { expect, it } from "vitest";
import { publishedStoryProgrammeContext, selectStoryDiscovery } from "./story-discovery";
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
