import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
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
for(const [device,width,height] of [['mobile',390,844],['desktop',1440,1000]])for(const route of routes)test(`complete page audit ${device} ${route}`,async({page,context})=>{
 test.setTimeout(60000);
 await page.setViewportSize({width,height});await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/api/analytics/page-view',r=>r.fulfill({status:204}));
 if(route.startsWith('/admin')&&route!=='/admin/login'&&route!=='/admin/forbidden')await context.addCookies([{name:'amaana_admin_session',value:seed.token,url:'http://127.0.0.1:3000',httpOnly:true,sameSite:'Strict'}]);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const response=await page.goto(route,{waitUntil:'load'});
 await page.evaluate(async()=>{await document.fonts.ready;});
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
 const textResizeOverflow=await page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>document.documentElement.clientWidth+1);
 await resizeStyle.evaluate(n=>n.remove());
 const violations=audit.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));
 await page.addStyleTag({content:'*{content-visibility:visible!important}'});
 await page.evaluate(async()=>{for(let top=0;top<document.documentElement.scrollHeight;top+=innerHeight*.8){window.scrollTo(0,top);await new Promise(r=>setTimeout(r,30));}window.scrollTo(0,0);});
 const directory=path.resolve('site-audit',device);fs.mkdirSync(directory,{recursive:true});
 const slug='complete-'+(route==='/'?'home':route.slice(1).replaceAll('/','--'));
 await page.screenshot({path:path.join(directory,slug+'.jpg'),type:'jpeg',quality:65,fullPage:true,animations:'disabled'});
 fs.writeFileSync(path.join(directory,slug+'.json'),JSON.stringify({route,sourceRoutes,status:response?.status(),finalPath:new URL(page.url()).pathname,width,height,metrics,textResizeOverflow,violations,incomplete:audit.incomplete.map(i=>({id:i.id,targets:i.nodes.map(n=>n.target)})),errors},null,2));
 expect(response?.ok(),route).toBe(true);expect(new URL(page.url()).pathname,route).toBe(route);
 if(!route.startsWith('/browser-acceptance/')){expect(metrics.headings,route).toHaveLength(1);expect(metrics.headings.join(' ')).not.toMatch(/platform is temporarily unavailable|page could not complete/i);}
 expect(metrics.overflow,route).toBe(false);expect(textResizeOverflow,`200% text resizing: ${route}`).toBe(false);expect(metrics.oversizedH2,route).toEqual([]);expect(metrics.brokenAnchors,route).toEqual([]);expect(errors,route).toEqual([]);
 expect(violations.filter(v=>['serious','critical'].includes(v.impact)),route).toEqual([]);
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
