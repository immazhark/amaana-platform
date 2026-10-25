import { expect, it } from "vitest";
import { selectStoryDiscovery } from "./story-discovery";
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
