import assert from 'node:assert/strict';
import {Prisma} from '@prisma/client';
import {applyMasterContent} from '../prisma/apply-master-content.mjs';
const rows=new Map();const calls=[];
function model(name){const allowed=new Set(Prisma.dmmf.datamodel.models.find(m=>m.name===name).fields.map(f=>f.name));return {
 findUnique:async({where})=>rows.get(`${name}:${where.slug}`)??null,
 findFirst:async()=>null,
 upsert:async({where,create,update})=>{for(const data of [create,update])for(const k of Object.keys(data))assert(allowed.has(k),`${name}.${k} is not a schema field`);const key=`${name}:${where.slug}`;const row={id:key,...(rows.get(key)??create),...update};rows.set(key,row);calls.push(name);return row;},
 updateMany:async()=>({count:0}),update:async()=>({}),create:async({data})=>{for(const k of Object.keys(data))assert(allowed.has(k),`${name}.${k}`);calls.push(name);return data;}
};}
const tx={initiative:model('Initiative'),cause:model('Cause'),mediaAsset:model('MediaAsset'),appeal:model('Appeal'),story:model('Story'),$executeRaw:async()=>0};
const client={$transaction:async(fn)=>fn(tx)};
assert.equal(await applyMasterContent(client),30);
const initial=calls.length;
assert.equal(await applyMasterContent(client),0);
assert.equal(calls.length,initial,'Second run must not reapply content or duplicate assets');
assert.equal([...rows.keys()].filter(k=>k.startsWith('Cause:')).length,5);
console.log('Migration dry-run passed: schema fields, 30 programmes, five umbrellas, eight image inserts, idempotent rerun. No live database was changed.');
