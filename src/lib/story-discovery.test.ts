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
it("finds reviewed titles with irregular internal whitespace", () => {
  const records = [{ title: "Winter\n  Kits", summary: "Verified public support", cause: { title: "Relief", status: "PUBLISHED" } }];
  const result = selectStoryDiscovery(records, { q: "WINTER KITS" });
  expect(result).toMatchObject({ invalid: false, count: 1 });
  expect(result.results).toEqual(records);
});

it("does not offer whitespace-only published cause titles as programme filters", () => {
 const records = [
   {title:"Blank direct",summary:"Public",cause:{status:"PUBLISHED",title:"  "}},
   {title:"Valid direct",summary:"Public",cause:{status:"PUBLISHED",title:"Education"}},
 ];
 const result = selectStoryDiscovery(records, {});
 expect(result.programmes).toEqual(["Education"]);
 expect(result.results).toEqual(records);
 expect(selectStoryDiscovery(records,{programme:"  "})).toMatchObject({invalid:true,count:0});
});

it("uses the published direct cause when a published initiative programme title is blank", () => {
 const story = {title:"Reviewed story",summary:"Public",cause:{status:"PUBLISHED",title:"Relief"},initiative:{status:"PUBLISHED",cause:{status:"PUBLISHED",title:" \t "}}};
 const result = selectStoryDiscovery([story],{programme:"Relief"});
 expect(result.programmes).toEqual(["Relief"]);
 expect(result.results[0]).toBe(story);
 expect(result.invalid).toBe(false);
});

it("preserves original reviewed published titles and initiative precedence", () => {
 const story = {title:"Story",summary:"Public",cause:{status:"PUBLISHED",title:"Direct"},initiative:{status:"PUBLISHED",cause:{status:"PUBLISHED",title:" Education "}}};
 const result = selectStoryDiscovery([story],{programme:" Education "});
 expect(result.programmes).toEqual([" Education "]);
 expect(result.results[0]).toBe(story);
});

it("does not expose unpublished programme text through blank-title fallback", () => {
 const story = {title:"Story",summary:"Public",cause:{status:"DRAFT",title:"Private"},initiative:{status:"PUBLISHED",cause:{status:"PUBLISHED",title:"  "}}};
 expect(selectStoryDiscovery([story],{}).programmes).toEqual([]);
 expect(selectStoryDiscovery([story],{programme:"Private"})).toMatchObject({invalid:true,count:0});
});

it("uses the published parent programme for both discovery filters and visible story context", () => {
 const story = { title: "Reviewed annual initiative", summary: "Public", cause: null,
   initiative: { title: "School kits 2026", status: "PUBLISHED",
     cause: { title: "Education", status: "PUBLISHED" } } };
 const result = selectStoryDiscovery([story], { programme: "Education" });
 expect(result).toMatchObject({ invalid: false, count: 1, programmes: ["Education"] });
 expect(publishedStoryProgrammeContext(story)).toBe("Education");
});

it("uses the published direct cause when the linked initiative cause title is blank", () => {
 const story = { title: "Reviewed", summary: "Public", cause: { title: "Relief", status: "PUBLISHED" },
   initiative: { title: "Unrelated initiative label", status: "PUBLISHED",
     cause: { title: "  \\t ", status: "PUBLISHED" } } };
 expect(selectStoryDiscovery([story], { programme: "Relief" }).count).toBe(1);
 expect(publishedStoryProgrammeContext(story)).toBe("Relief");
});

it("never labels public stories with unpublished programme context, preserving published original spelling", () => {
 const privateStory = { title: "Reviewed", summary: "Public",
   cause: { title: "Private", status: "DRAFT" },
   initiative: { title: "Internal", status: "DRAFT",
     cause: { title: "Unpublished", status: "PUBLISHED" } } };
 expect(publishedStoryProgrammeContext(privateStory)).toBeNull();
 expect(selectStoryDiscovery([privateStory], {}).programmes).toEqual([]);
 const publicStory = { ...privateStory, cause: { title: " Education ", status: "PUBLISHED" } };
 expect(publishedStoryProgrammeContext(publicStory)).toBe(" Education ");
});
