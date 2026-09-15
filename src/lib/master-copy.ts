import master from '@/content/master-copy.json';
export const programmes = master.initiatives;
export const programmeCategories = master.categories;
export const programmeBySlug = (slug: string) => programmes.find(item => item.slug === slug);
export const programmeChildren = (slug: string) => programmes.filter(item => 'parentSlug' in item && item.parentSlug === slug);
export const complianceCopy = {
 domestic: 'Domestic donations only. Amaana Foundation is not FCRA-registered.',
 tax: 'Amaana Foundation currently holds provisional approval under Section 80G via Form 10AC dated 26 January 2026 for AY 2026–27 through AY 2028–29. Tax treatment depends on applicable law, donor eligibility and valid receipt/compliance requirements.',
};
export function cleanCopy(text: string) { return text.replace(/\*\*/g, '').replace(/^#{1,6}\s+/gm, '').trim(); }
export function copyBetween(text: string, start: string, end?: string) {
 const offset=text.indexOf(start); if(offset<0)throw new Error(`Missing canonical marker: ${start}`);
 const rest=text.slice(offset+start.length); const last=end?rest.indexOf(end):-1;
 return cleanCopy(last<0?rest:rest.slice(0,last));
}
export function masterSection(number: number) { const pages=master.pages as Record<string,{name:string;source:string}>;return pages[String(number)].source; }
