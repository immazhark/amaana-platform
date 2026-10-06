import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import AxeBuilder from '@axe-core/playwright';
import {test,expect} from '@playwright/test';

const workspace = process.env.AMAANA_APP_WORKSPACE ?? process.cwd();
const seed = JSON.parse(execFileSync(process.execPath,['scripts/seed-ui-route-audit.mjs'],{cwd:workspace,env:{...process.env,AMAANA_UI_AUDIT_TARGET:'isolated-ci'},encoding:'utf8'}));
function pages(directory) {return fs.readdirSync(directory,{withFileTypes:true}).flatMap(item=>item.isDirectory()?pages(path.join(directory,item.name)):item.name==='page.tsx'?[path.join(directory,item.name)]:[]);}
const sourcePages = pages(path.join(workspace,'src/app'));
const normalize = file=>'/'+path.relative(path.join(workspace,'src/app'),path.dirname(file)).split(path.sep).filter(p=>p&&!p.startsWith('(')).join('/');
const sourceRoutes = sourcePages.map(file=>({file:path.relative(workspace,file),route:normalize(file)}));
const staticRoutes = sourceRoutes.filter(r=>!r.route.includes('[')).map(r=>r.route);
const adminDetail = [`/admin/requests/${seed.requestId}`,`/admin/appeals/${seed.appealId}`,`/admin/appeals/${seed.draftId}`,`/admin/donations/${seed.donationId}`];
const routes = [...new Set([...staticRoutes,...seed.publicRoutes,...adminDetail,'/programmes/medical-financial-relief','/programmes/emergency-relief','/programmes/ramadan-eid','/programmes/seasonal-relief','/donations/invalid/acknowledgement'])].sort();
test.describe.configure({retries:0});
const horizontalOverflowDetails=()=>{
 const viewportWidth=document.documentElement.clientWidth;
 const scrollWidth=Math.max(document.documentElement.scrollWidth,document.body.scrollWidth);
 const offenders=[...document.body.querySelectorAll('*')].flatMap(node=>{
  const rect=node.getBoundingClientRect();
  if(rect.width<=0||(rect.right<=viewportWidth+1&&rect.left>=-1))return [];
  let scrollAncestor=null;
  for(let parent=node.parentElement;parent&&parent!==document.body;parent=parent.parentElement){
   const style=getComputedStyle(parent);
   if(['auto','scroll','hidden','clip'].includes(style.overflowX)){
    const parentRect=parent.getBoundingClientRect();
    scrollAncestor={tag:parent.tagName.toLowerCase(),className:parent.className||'',overflowX:style.overflowX,left:Math.round(parentRect.left),right:Math.round(parentRect.right)};
    break;
   }
  }
  return [{tag:node.tagName.toLowerCase(),id:node.id||'',className:typeof node.className==='string'?node.className:'',text:(node.textContent||'').trim().replace(/\\s+/g,' ').slice(0,96),left:Math.round(rect.left),right:Math.round(rect.right),width:Math.round(rect.width),scrollAncestor}];
 }).slice(0,12);
 return {overflow:scrollWidth>viewportWidth+1,viewportWidth,scrollWidth,offenders};
};
for(const [device,width,height] of [['mobile',390,844],['desktop',1440,1000]])for(const route of routes)test(`complete page audit ${device} ${route}`,async({page,context})=>{
 test.setTimeout(60000);
 await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/api/analytics/page-view',r=>r.fulfill({status:204}));
 if(route.startsWith('/admin')&&route!=='/admin/login'&&route!=='/admin/forbidden')await context.addCookies([{name:'amaana_admin_session',value:seed.token,url:'http://127.0.0.1:3000',httpOnly:true,sameSite:'Strict'}]);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto(route,{waitUntil:'load'});
 await page.evaluate(async()=>{await document.fonts.ready;});
 const overflowDetails=await page.evaluate(horizontalOverflowDetails);
 const metrics=await page.evaluate(()=>{
  const visible=n=>n.getBoundingClientRect().width>0&&!n.closest('[hidden],[inert],[aria-hidden="true"]');
  return {overflow:Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>document.documentElement.clientWidth+1,
   headings:[...document.querySelectorAll('main h1')].map(n=>n.textContent.trim()),
   oversizedH2:[...document.querySelectorAll('main h2')].filter(n=>visible(n)&&!n.closest('.v3-home-banner,.page-hero')&&parseFloat(getComputedStyle(n).fontSize)>56.1).map(n=>({text:n.textContent,size:getComputedStyle(n).fontSize})),
   images:[...document.querySelectorAll('main img')].filter(n=>n.complete&&n.naturalWidth===0).map(n=>n.getAttribute('src')),
   brokenAnchors:[...document.querySelectorAll('main a[href^="#"]')].filter(n=>n.hash.length>1&&!document.getElementById(decodeURIComponent(n.hash.slice(1)))).map(n=>n.hash)};
 });
 const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag2aaa']).analyze();
 const resizeStyle=await page.addStyleTag({content:'html{font-size:200%!important}'});
 const textResizeDetails=await page.evaluate(horizontalOverflowDetails);
 const textResizeOverflow=textResizeDetails.overflow;
 await resizeStyle.evaluate(n=>n.remove());
 const violations=audit.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));
 const prohibitedAria=audit.incomplete.filter(i=>i.id==='aria-prohibited-attr').flatMap(i=>i.nodes.map(n=>n.target));
 await page.addStyleTag({content:'*{content-visibility:visible!important}'});
 await page.evaluate(async()=>{for(let top=0;top<document.documentElement.scrollHeight;top+=innerHeight*.8){window.scrollTo(0,top);await new Promise(r=>setTimeout(r,30));}window.scrollTo(0,0);});
 const directory=path.resolve('site-audit',device);fs.mkdirSync(directory,{recursive:true});
 const slug='complete-'+(route==='/'?'home':route.slice(1).replaceAll('/','--'));
 await page.screenshot({path:path.join(directory,slug+'.jpg'),type:'jpeg',quality:65,fullPage:true,animations:'disabled'});
 fs.writeFileSync(path.join(directory,slug+'.json'),JSON.stringify({route,sourceRoutes,status:response?.status(),finalPath:new URL(page.url()).pathname,width,height,metrics,overflowDetails,textResizeOverflow,textResizeDetails,violations,incomplete:audit.incomplete.map(i=>({id:i.id,targets:i.nodes.map(n=>n.target)})),errors},null,2));
 const expectedStatus=route==='/donate/synthetic-ui-audit'?404:200;
 expect(response?.status(),route).toBe(expectedStatus);
 expect(new URL(page.url()).pathname,route).toBe(route==='/our-work/medical-financial-assistance'?'/programmes/medical-financial-relief':route);
 if(!route.startsWith('/browser-acceptance/')){expect(metrics.headings,route).toHaveLength(1);expect(metrics.headings.join(' ')).not.toMatch(/platform is temporarily unavailable|page could not complete/i);}
 expect(metrics.overflow,`${route}: ${JSON.stringify(overflowDetails)}`).toBe(false);expect(textResizeOverflow,`200% text resizing: ${route}: ${JSON.stringify(textResizeDetails)}`).toBe(false);expect(metrics.oversizedH2,route).toEqual([]);expect(metrics.brokenAnchors,route).toEqual([]);expect(errors,route).toEqual([]);
 expect(violations.filter(v=>['serious','critical'].includes(v.impact)),route).toEqual([]);
 expect(prohibitedAria,`aria-prohibited-attr: ${route}`).toEqual([]);
});

for (const [device,width,height] of [['mobile',390,844],['desktop',1440,1000]]) {
  test(`source-rendered root interruption ${device}`, async ({page}) => {
    await page.setViewportSize({width,height});
    const html = execFileSync(process.execPath,['--input-type=commonjs','-'],{cwd:workspace,encoding:'utf8',input:`
      const fs=require('node:fs'),ts=require('typescript'),React=require('react'),server=require('react-dom/server');
      const source=fs.readFileSync('src/app/global-error.tsx','utf8');
      const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
      const box={exports:{}};new Function('require','module','exports',code)(require,box,box.exports);
      process.stdout.write('<!doctype html>'+server.renderToStaticMarkup(React.createElement(box.exports.default,{error:new Error('Synthetic layout audit'),reset:()=>{}})));
    `});
    await page.goto('/about');await page.setContent(html);
    const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag2aaa']).analyze();
    const geometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,heading:document.querySelector('h1')?.textContent}));
    const directory=path.resolve('site-audit',device);fs.mkdirSync(directory,{recursive:true});
    await page.screenshot({path:path.join(directory,'complete-global-error.jpg'),type:'jpeg',quality:65,fullPage:true});
    fs.writeFileSync(path.join(directory,'complete-global-error.json'),JSON.stringify({route:'global-error.tsx',evidence:'Source-rendered isolated layout; recovery callback is reviewed in source, not exercised by this static render.',width,height,geometry,violations:audit.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))},null,2));
    expect(geometry.overflow).toBe(false);
    await expect(page.getByRole('button',{name:'Try again →',exact:true})).toBeVisible();
    expect(audit.violations.filter(v=>['serious','critical'].includes(v.impact))).toEqual([]);
  });
}

for (const [device,width,height] of [['mobile',390,844],['desktop',1440,1000]]) {
  test(`source-rendered route interruption ${device}`, async ({page}) => {
    await page.setViewportSize({width,height});
    const html = execFileSync(process.execPath,['--input-type=commonjs','-'],{cwd:workspace,encoding:'utf8',input:`
      const fs=require('node:fs'),ts=require('typescript'),React=require('react'),server=require('react-dom/server');
      const source=fs.readFileSync('src/app/error.tsx','utf8');
      const code=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
      const box={exports:{}};new Function('require','module','exports',code)(require,box,box.exports);
      process.stdout.write('<!doctype html>'+server.renderToStaticMarkup(React.createElement(box.exports.default,{error:new Error('Synthetic layout audit'),reset:()=>{}})));
    `});
    await page.goto('/about');const head=await page.locator('head').innerHTML();await page.setContent('<!doctype html><html lang="en"><head>'+head+'</head><body><main>'+html+'</main></body></html>');await page.evaluate(async()=>{await document.fonts.ready;});
    const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag2aaa']).analyze();
    const geometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,heading:document.querySelector('h1')?.textContent}));
    const directory=path.resolve('site-audit',device);fs.mkdirSync(directory,{recursive:true});
    await page.screenshot({path:path.join(directory,'complete-route-error.jpg'),type:'jpeg',quality:65,fullPage:true});
    fs.writeFileSync(path.join(directory,'complete-route-error.json'),JSON.stringify({route:'error.tsx',evidence:'Source-rendered isolated layout; recovery callback is reviewed in source, not exercised by this static render.',width,height,geometry,violations:audit.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))},null,2));
    expect(geometry.overflow).toBe(false);
    await expect(page.getByRole('button',{name:'Try again',exact:true})).toBeVisible();
    expect(audit.violations.filter(v=>['serious','critical'].includes(v.impact))).toEqual([]);
  });
}

const acknowledgementStates = [
  {tone:'captured',heading:'JazakAllahu Khairan.',summary:'Amaana Foundation recorded your contribution.',statusLabel:'Payment verified'},
  {tone:'pending',heading:'Your transfer is awaiting verification.',summary:'The transfer reference is recorded and will be reviewed.',statusLabel:'Awaiting verification'},
  {tone:'refunded',heading:'This donation has been refunded.',summary:'The private record remains available after the refund.',statusLabel:'Refund processed'},
];
for(const [device,width,height] of [['mobile',390,844],['desktop',1440,1000]])for(const presentation of acknowledgementStates)test(`private acknowledgement UI ${presentation.tone} ${device}`,async({page})=>{
 const reference='AFD-SYNTHETIC-UI-ACK';
 await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/api/donations/acknowledgement',r=>r.fulfill({status:200,json:{found:true,presentation,donation:{referenceNumber:reference,receiptNumber:'ACK-SYNTHETIC',donorName:'Synthetic donor',givingIntent:'GENERAL',amount:100,refundedAmount:presentation.tone==='refunded'?100:0,recordDate:'2026-10-01T00:00:00Z',providerPaymentId:null,appeal:{title:'Synthetic UI audit appeal',slug:'synthetic-ui-audit'}}}}));
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`/donations/${reference}/acknowledgement#token=synthetic-private-acknowledgement-token`);
 await expect(page.getByRole('heading',{name:presentation.heading,exact:true})).toBeVisible();
 expect(await page.evaluate(()=>location.search+location.hash)).toBe('');
 const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag2aaa']).analyze();
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 const directory=path.resolve('site-audit',device);fs.mkdirSync(directory,{recursive:true});
 await page.screenshot({path:path.join(directory,`complete-private-ack-${presentation.tone}.jpg`),type:'jpeg',quality:65,fullPage:true,animations:'disabled'});
 fs.writeFileSync(path.join(directory,`complete-private-ack-${presentation.tone}.json`),JSON.stringify({route:'/donations/[reference]/acknowledgement',state:presentation.tone,evidence:'Actual client UI with mocked API transport; server token gates retain existing unit/database coverage.',width,height,overflow,errors,violations:audit.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))},null,2));
 expect(overflow).toBe(false);expect(errors).toEqual([]);expect(audit.violations.filter(v=>['serious','critical'].includes(v.impact))).toEqual([]);
});

for(const status of [429,503])test(`temporary acknowledgement failure ${status} retains private retry credentials`,async({page})=>{
 const credentials={reference:'AFD-SYNTHETIC-RETRY',token:'synthetic-private-acknowledgement-retry-token'},requests=[];
 await page.route('**/api/donations/acknowledgement',r=>{
  requests.push(r.request().postDataJSON());
  if(requests.length===1)return r.fulfill({status,json:{error:'Temporarily unavailable'}});
  return r.fulfill({status:200,json:{found:true,presentation:acknowledgementStates[0],donation:{referenceNumber:credentials.reference,receiptNumber:'ACK-SYNTHETIC',donorName:'Synthetic donor',givingIntent:'GENERAL',amount:100,refundedAmount:0,recordDate:'2026-10-01T00:00:00Z',providerPaymentId:null,appeal:{title:'Synthetic UI audit appeal',slug:'synthetic-ui-audit'}}}});
 });
 await page.goto(`/donations/${credentials.reference}/acknowledgement#token=${credentials.token}`);
 await expect(page.getByRole('heading',{name:'Unable to open your acknowledgement.',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>location.search+location.hash)).toBe('');
 await page.getByRole('button',{name:'Try again',exact:true}).click();
 await expect(page.getByRole('heading',{name:'JazakAllahu Khairan.',exact:true})).toBeVisible();
 expect(requests).toEqual([credentials,credentials]);expect(await page.evaluate(()=>location.search+location.hash)).toBe('');
});
