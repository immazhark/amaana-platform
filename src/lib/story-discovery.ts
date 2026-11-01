import { hasUnsupportedPublicQueryFields } from "./public-navigation-query.mjs";
export type StorySearch = Record<string, string | string[] | undefined>;
type PublicStory = { title: string; summary: string; cause?: {title:string;status:string}|null; initiative?: {status:string;cause:{title?:string;status:string}}|null };
export const STORY_PAGE_SIZE = 12;
export function selectStoryDiscovery<T extends PublicStory>(records: readonly T[], search: StorySearch) {
 const context = (story: T) => {
  const initiativeCause = story.initiative?.status === "PUBLISHED" && story.initiative.cause.status === "PUBLISHED"
    ? story.initiative.cause.title : null;
  if (initiativeCause?.trim()) return initiativeCause;
  const directCause = story.cause?.status === "PUBLISHED" ? story.cause.title : null;
  return directCause?.trim() ? directCause : null;
 };
 const programmes = [...new Set(records.flatMap(story => context(story) ? [context(story)!] : []))].sort();
 const q = typeof search.q === "string" ? search.q.trim().replace(/\s+/g," ") : "";
 const programme = typeof search.programme === "string" ? search.programme : "";
 const invalid = hasUnsupportedPublicQueryFields(search,["q","programme","page"]) || Array.isArray(search.q) || Array.isArray(search.programme) || Array.isArray(search.page)
   || q.length > 80 || /[\u0000-\u001f\u007f]/.test(typeof search.q === "string" ? search.q : "")
   || Boolean(programme && !programmes.includes(programme)) || Boolean(search.page && (typeof search.page !== "string" || !/^[1-9]\d*$/.test(search.page) || !Number.isSafeInteger(Number(search.page))));
 const matching = invalid ? [] : records.filter(story => (!programme || context(story) === programme) && (!q || `${story.title} ${story.summary}`.toLocaleLowerCase("en").includes(q.toLocaleLowerCase("en"))));
 const totalPages = Math.max(1,Math.ceil(matching.length/STORY_PAGE_SIZE));
 const page = invalid ? 1 : Math.min(Number(search.page || 1),totalPages);
 return { q:invalid?"":q,programme:invalid?"":programme,invalid,programmes,page,totalPages,count:matching.length,results:matching.slice((page-1)*STORY_PAGE_SIZE,page*STORY_PAGE_SIZE),active:Boolean(q||programme||search.page||invalid) };
}
