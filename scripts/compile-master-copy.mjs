import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const source=fs.readFileSync(path.join(root,'docs/Amaana_Foundation_Master_Website_Copy.md'),'utf8').replace(/\r/g,'');
const clean=s=>s.replace(/\*\*/g,'').replace(/(?<!\w)\*(?!\s)/g,'').replace(/\*(?!\w)/g,'').trim();
function between(s,a,b){const i=s.indexOf(a);if(i<0)throw Error('Missing source marker '+a);const rest=s.slice(i+a.length);const end=b?rest.indexOf(b):-1;return end<0?rest:rest.slice(0,end);}
function section(a,b){return between(source,'\n'+a,b?'\n'+b:undefined);}
function field(s,label){return clean(between(s,label,'\n### '));}
function option(s){return clean(between(between(s,'### Option A','### Option B'),'**Summary:**','\n### '));}
function primary(s){return field(s,'### Website Summary');}
const categories=[
 ['medical-financial-relief','Medical & Financial Relief'],['emergency-humanitarian-relief','Emergency & Humanitarian Relief'],['ramadan-eid','Ramadan & Eid Initiatives'],['amaana-taleem','Amaana Taleem Initiative'],['seasonal-relief','Seasonal Relief & Essentials']
].map(([slug,title],displayOrder)=>({slug,title,displayOrder,summary:clean(between(section('## Category Card Copy for Our Work','## Non-Negotiable'),`### ${title}\n`,'\nCTA:')),description:''}));
const items=[];
function add(slug,title,summary,cause,metric=null,label=null,extra={}){items.push({slug,title,summary:summary.split('\n\n')[0],story:summary,causeSlug:categories[cause].slug,primaryMetric:metric,primaryMetricLabel:label,...extra});}
const medicalSlugs=['auto-rickshaw-livelihood-support','emergency-neonatal-medical-aid','oral-cancer-surgery-support','aliza-critical-care-support','severe-burn-treatment-support','jewellery-loan-intervention'];
const amounts=['₹95,000','₹107,200','₹319,000','₹482,700','₹72,000','₹138,300'];
for(let n=1;n<=6;n++){const s=section(`## ${n}. `,n===6?'# Emergency':`## ${n+1}. `);let copy=primary(s);if(n===6){copy=copy.replace(/Mohammed Hussain/g,'an auto-rickshaw driver').replace(/His youngest son has thalassemia[^.]*\./g,'His family also faced ongoing medical needs.');copy=copy.replace(/thalassemia/gi,'ongoing medical needs');}add(medicalSlugs[n-1],field(s,'### Recommended Website Heading'),copy,0,amounts[n-1],n===6?'privately pooled · debt cleared':'raised toward this case',{programmeStatus:'COMPLETED',...(n===3?{year:2025}:{})});}
const flood=section('## 7. Hyderabad','## COVID');
add('hyderabad-flood-relief-2020',field(flood,'### Recommended Website Heading'),primary(flood),1,'3 phases','October–November 2020',{year:2020,programmeStatus:'HISTORICAL',facts:['Phase 1: approximately ₹125,000 raised; 82 ration kits worth approximately ₹60,000 distributed in Baba Nagar and Balapur.','Phase 1 also supported affected households directly and through HHF, Sakina Foundation, Deccanistan and Jamaat-e-Islami Hind.','Phase 2: 60 expanded relief kits worth over ₹100,000 handed to Safa Baitul Maal for assessed families.','Phase 3: a designated ₹50,000 donor contribution transferred to Safa Baitul Maal.','These activities were carried out by the founding team before formal registration. No exact unique-beneficiary total is available.']});
const covid=section('## COVID','# Ramadan & Eid');
add('covid-essential-support-2020',field(covid,'### Recommended Website Heading'),primary(covid),1,null,null,{year:2020,programmeStatus:'HISTORICAL'});
const dates=section('## 8. Dates','## 9. Qurbani');
const qurbani=section('## 9. Qurbani','## 10. Eid');
const eid=section('## 10. Eid','# Initiative #11');
for(const [slug,s,title,metric,label,from,to] of [['dates-distribution',dates,'Sharing the Blessing of Iftar','420 kg','dates distributed · 2023–2026',2023,2026],['qurbani-meat-distribution',qurbani,'Qurbani Meat Distribution','500+','family distributions · 2025–2026',2025,2026],['eid-gift-kits',eid,'Eid Gift Kits — Celebrating Eid With Dignity','2,830','family distributions · seven annual drives',2020,2026]]){
 let summary=slug==='eid-gift-kits'?clean(between(between(s,'### Category — Direct & Transparent Option','### Category — Inspiring'),'**Eid Gift Kits for Families Facing Financial Hardship**','###')):field(s,'### Category Website Summary');
 add(slug,title,summary,2,metric,label,{startYear:from,endYear:to,programmeStatus:'RECURRING'});
 for(let year=from;year<=to;year++){const annual=between(s,`### ${year} —`,year<to?`### ${year+1} —`:'### Year-by-Year');const copy=clean(between(annual,'**Website Summary:**','**Card Copy:**'));const title=clean(annual.split('\n')[0]);add(`${slug}-${year}`,`${year} — ${title}`,copy,2,null,null,{year,parentSlug:slug,programmeStatus:'COMPLETED'});}
}
const taleem=section('# Initiative #11','# 12. Seasonal');
add('taleem','Amaana Taleem Initiative — Education Support With Purpose and Accountability',option(taleem),3,'25','Nazira / Hifdh students combined · September 2026',{programmeStatus:'RECURRING'});
for(const [n,slug,title,status] of [[1,'taleem-initiative-2025','Stationery Kits for Orphan Students','COMPLETED'],[2,'taleem-hifdh-sponsorship',"Sponsor a Hifdh Student",'ONGOING'],[3,'taleem-nazira-sponsorship',"Sponsor Qur’an Nazira Education",'ONGOING'],[4,'taleem-school-college-sponsorship',"Sponsor a Student’s School or College Education",'EXPANDING']]){const s=between(taleem,`## Taleem Programme ${n}`,n<4?`## Taleem Programme ${n+1}`:'## Recommended Taleem');add(slug,title,option(s),3,n===1?'50':null,n===1?'orphan children · Borabanda, Hyderabad':null,{parentSlug:'taleem',programmeStatus:status,...(n===1?{year:2025}:{})});}
const winter=section('# Winter Drive 2025–26','# ORGANIZATION-WIDE');
add('winter-relief','Winter Drive 2025–26 — Warmth for Children and Vulnerable Families',option(winter),4,'234','people reached overall · donor acknowledgement',{startYear:2025,endYear:2026,programmeStatus:'COMPLETED',facts:['Phase 1: 96 madrasa students.','Phase 2: 101 Winter Kits.','The phase measures and overall acknowledgement use different units. They are not added together.']});
categories[0].description=primary(section('## Category Introduction — Medical','## 1.'));
categories[1].description=categories[1].summary;categories[2].description=categories[2].summary;categories[3].description=option(taleem);categories[4].description=option(section('# 12. Seasonal','# Winter Drive'));
const pages={};for(let n=13;n<=35;n++){const marker=new RegExp(`^# ${n}\\. .+$`,'m').exec(source);if(!marker)continue;const s=source.slice(marker.index+marker[0].length).split(new RegExp(`\\n# ${n+1}\\. `))[0];pages[n]={name:marker[0].replace(/^# \d+\. /,''),source:s.trim()};}
const debt=items.find(i=>i.slug==='jewellery-loan-intervention');
debt.story=debt.story.replace('an auto-rickshaw driver, an auto-rickshaw driver and father of two','An auto-rickshaw driver and father of two').replace('required ongoing treatment for ongoing medical needs','had ongoing medical needs');debt.summary=debt.story;
const winterItem=items.find(i=>i.slug==='winter-relief');
winterItem.story=winterItem.story.replace('A donor acknowledgement for the overall winter effort recorded 234 people reached.','The phase records use different measures and are reported separately.');winterItem.primaryMetric='96 students';winterItem.primaryMetricLabel='Phase 1 · 101 Winter Kits in Phase 2';winterItem.facts=['Phase 1: 96 madrasa students.','Phase 2: 101 Winter Kits.','These are separate phase measures, not one combined beneficiary total.'];winterItem.dataCaveat='Broader 234 figure has unresolved people/kit terminology; not approved as a definitive public metric.';
for(const i of items.filter(i=>i.parentSlug==='eid-gift-kits')){const counts=[85,171,339,408,467,650,710];i.primaryMetric=String(counts[i.year-2020]);i.primaryMetricLabel='families reached in '+i.year;}
for(const i of items.filter(i=>i.parentSlug==='dates-distribution')){i.primaryMetric=String({2023:78,2024:90,2025:90,2026:162}[i.year])+' kg';i.primaryMetricLabel='dates distributed in '+i.year;}
for(const i of items.filter(i=>i.parentSlug==='qurbani-meat-distribution')){i.primaryMetric=i.year===2025?'150+':'350+';i.primaryMetricLabel='families reached in '+i.year;}
const output={version:'master-2026-09-15-v1',categories,initiatives:items,pages};
for(const dir of ['src/content','prisma'])fs.mkdirSync(path.join(root,dir),{recursive:true});
fs.writeFileSync(path.join(root,'src/content/master-copy.json'),JSON.stringify(output,null,2)+'\n');
fs.writeFileSync(path.join(root,'prisma/master-programmes.json'),JSON.stringify({version:output.version,categories,initiatives:items},null,2)+'\n');
console.log(`Compiled ${items.length} programme records and ${Object.keys(pages).length} page sections from canonical copy.`);
