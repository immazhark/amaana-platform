import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
if (process.env.AMAANA_DATABASE_TESTS !== 'true') throw new Error('Run only against the isolated acceptance database with AMAANA_DATABASE_TESTS=true.');
const prisma = new PrismaClient();
class RollbackProbe extends Error {}
try {
 const original = await prisma.homeCarousel.findUniqueOrThrow({where:{id:'homepage'}});
 assert.equal(original.revision,1);
 assert.deepEqual(original.config.slides.map(s=>s.id),['origin','eid','medical','taleem','qurbani']);
 assert.ok(original.config.slides.every(s=>s.status==='PUBLISHED' && !s.appealSlug && !s.startsAt && !s.endsAt));
 try {
  await prisma.$transaction(async tx=>{
   const saved=await tx.homeCarousel.updateMany({where:{id:'homepage',revision:1},data:{revision:{increment:1},config:{...original.config,appealPosition:2}}});
   assert.equal(saved.count,1);
   const stale=await tx.homeCarousel.updateMany({where:{id:'homepage',revision:1},data:{revision:{increment:1}}});
   assert.equal(stale.count,0);
   const read=await tx.homeCarousel.findUniqueOrThrow({where:{id:'homepage'}});
   assert.equal(read.revision,2);assert.equal(read.config.appealPosition,2);
   throw new RollbackProbe();
  });
 } catch(error){if(!(error instanceof RollbackProbe)) throw error;}
 const unchanged=await prisma.homeCarousel.findUniqueOrThrow({where:{id:'homepage'}});
 assert.equal(unchanged.revision,original.revision);assert.deepEqual(unchanged.config,original.config);
 console.log('Homepage carousel migration, JSON persistence, revision guard and transaction rollback passed.');
} finally {await prisma.$disconnect();}
