/* eslint-disable @typescript-eslint/no-require-imports */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
const master=require('../src/content/master-copy.json');
const load=(file)=>{const exports={};const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;new Function('require','exports',code)((id)=>id==='@/content/master-copy.json'?master:id==='@/lib/master-copy'?load('src/lib/master-copy.ts'):require(id),exports);return exports;};
assert.equal(master.categories.length,5);
assert.equal(new Set(master.initiatives.map(p=>p.slug)).size,master.initiatives.length);
for(const p of master.initiatives){assert(p.title&&p.story);assert(!/Codex|Implementation note|Option [AB]|Recommended Website|\*\*/i.test(p.story),p.slug);if(p.parentSlug)assert(master.initiatives.some(q=>q.slug===p.parentSlug));}
const debt=master.initiatives.find(p=>p.slug==='jewellery-loan-intervention');
assert(!/Hussain|thalassemia/i.test(JSON.stringify(debt)));
assert.equal(debt.primaryMetric,'₹138,300');
const org=load('src/lib/organization-copy.ts');
for(const key of ['aboutCopy','verificationCopy','transparencyCopy','governanceCopy']){const page=org[key];assert(page.title&&page.intro,key);assert(!/Codex|\*\*|---|##|Alternative|Implementation/i.test(JSON.stringify(page)),key);for(const b of page.blocks)assert(b.title.trim(),`${key}: empty block heading`);}
console.log(`Verified ${master.initiatives.length} canonical programmes, five umbrellas, organisation copy and debt privacy rules.`);
