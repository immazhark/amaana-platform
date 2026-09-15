import {masterSection,copyBetween,cleanCopy} from '@/lib/master-copy';
import type {ArticleBlock} from '@/components/canonical-article';
const slice=(s:string,a:string,b?:string)=>copyBetween(s,a,b);
const paragraphs=(s:string)=>s.split(/\n\s*\n/).map(cleanCopy).filter(Boolean);
const block=(s:string,title:string,begin:string,end?:string):ArticleBlock=>({title,paragraphs:paragraphs(slice(s,begin,end))});
const p14=masterSection(14),p15=masterSection(15),p16=masterSection(16),p17=masterSection(17),p18=masterSection(18),p19=masterSection(19);
export const aboutCopy={title:slice(p14,'## Page Title','## Intro'),intro:slice(p14,'## Intro','---'),blocks:[
 block(p14,'From a Ramadan Effort to a Continuing Responsibility','**Copy:**','**CTA:**'),
 block(p14.slice(p14.indexOf('## What “Amaana” Means')),'Amaana Means Trust','**Copy:**','---'),
 {title:'Mission',paragraphs:[slice(p15,'## Mission','## Vision')]},
 {title:'Vision',paragraphs:[slice(p15,'## Vision','## Our Values')]},
 ...slice(p15,'## Our Values','---').split(/\n### /).filter(Boolean).map(s=>({title:cleanCopy(s.split('\n')[0]).replace(/^### /,''),paragraphs:paragraphs(s.split('\n').slice(1).join('\n'))})),
 block(p16,'Support Based on Need, Not Labels','## Copy','---')
]};
export const verificationCopy={title:slice(p17,'## Page Title','## Intro'),intro:slice(p17,'## Intro','## From Request'),blocks:[
 ...slice(p17,'## From Request to Relief','## Core Principle').split(/\n### /).filter(s=>s.trim()).map(s=>({title:cleanCopy(s.split('\n')[0]).replace(/^### /,''),paragraphs:paragraphs(s.split('\n').slice(1).join('\n'))})),
 {title:'Public Evidence. Private Proofs.',paragraphs:[slice(p17,'### **Public Evidence. Private Proofs.**','**CTA:**')]}
]};
export const transparencyCopy={title:slice(p18,'## Page Title','## Intro'),intro:slice(p18,'## Intro','## How Amaana'),blocks:[
 {title:'How Amaana Builds Accountability',items:slice(p18,'## How Amaana Builds Accountability','## What We').split('\n').filter(l=>l.startsWith('- ')).map(l=>l.slice(2))},
 {title:'What We Intentionally Keep Private',items:slice(p18,'## What We Intentionally Keep Private','## Reporting').split('\n').filter(l=>l.startsWith('- ')).map(l=>l.slice(2))},
 block(p18,'Reporting Philosophy','## Reporting Philosophy','**CTAs:**')
]};
export const governanceCopy={title:slice(p19,'## Page Title','## Intro'),intro:slice(p19,'## Intro','## Governance'),blocks:[
 {title:'Mohammed Mazhar Khan',paragraphs:['Founder & Managing Trustee','Leads Amaana’s overall direction, public accountability and primary operational/content approval.']},
 {title:'Mohammed Ather Khan',paragraphs:['Trustee & Treasurer','Supports governance, financial oversight and backup administrative responsibility.']},
 {title:'Syed Uqba Ali',paragraphs:['Trustee','Part of Amaana Foundation’s formal trustee structure.']},
 {title:'Registration & Compliance',paragraphs:['Registered charitable trust · 23 February 2024 · BK-4, CS No. 59/2024, Hyderabad, Telangana.','NGO DARPAN: TS/2024/0403215 · registered 21 May 2024.','Section 80G: provisional approval via Form 10AC dated 26 January 2026, covering AY 2026–27 through AY 2028–29.','Current 12A / 12AB status awaits confirmation from Amaana’s Chartered Accountant. Amaana Foundation is not FCRA-registered. Public fundraising remains domestic only.']}
]};
export function simplePage(number:number,copyMarker='## Copy'){
 const s=masterSection(number);return {title:slice(s,'## Page Title',s.includes('## Intro')?'## Intro':copyMarker),intro:slice(s,s.includes('## Intro')?'## Intro':copyMarker,'\n## ')};
}
