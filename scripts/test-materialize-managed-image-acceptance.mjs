import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { materializeManagedImageAcceptance } from './materialize-managed-image-acceptance.mjs';
const route = (root, i) => path.join(root,'src/app/media/2099',`00000000-0000-4000-8000-00000000000${i}.jpg`,'route.ts');
const handler = root => path.join(root,'src/app/browser-acceptance/managed-image-source/handler.ts');
async function workspace() {
  const root = await mkdtemp(path.join(tmpdir(),'amaana-managed-routes-'));
  const source = path.join(root,'e2e/fixtures/browser-acceptance/managed-image-source/route.ts.fixture');
  await mkdir(path.dirname(source),{recursive:true});
  await writeFile(source,'// synthetic source');
  return root;
}
test('materializes exactly four static routes and shared handler only in acceptance', async () => {
  const root = await workspace();
  try {
    await materializeManagedImageAcceptance(root,false);
    await assert.rejects(access(route(root,1)),{code:'ENOENT'});
    await materializeManagedImageAcceptance(root,true);
    for(let i=1;i<=4;i++) assert.match(await readFile(route(root,i),'utf8'),/export const GET = serve/);
    assert.equal(await readFile(handler(root),'utf8'),'// synthetic source');
    await assert.rejects(access(route(root,5)),{code:'ENOENT'});
    await materializeManagedImageAcceptance(root,false);
    for(let i=1;i<=4;i++) await assert.rejects(access(route(root,i)),{code:'ENOENT'});
  } finally { await rm(root,{recursive:true,force:true}); }
});
test('never overwrites or removes a non-fixture route in either mode', async () => {
  const root = await workspace();
  try {
    await mkdir(path.dirname(route(root,4)),{recursive:true});
    await writeFile(route(root,4),'// actual route');
    for(const enabled of [true,false]) {
      await assert.rejects(materializeManagedImageAcceptance(root,enabled),/Unexpected file/);
      assert.equal(await readFile(route(root,4),'utf8'),'// actual route');
      await assert.rejects(access(route(root,1)),{code:'ENOENT'});
    }
  } finally { await rm(root,{recursive:true,force:true}); }
});
