import { readFile } from 'node:fs/promises';

async function applyCanonicalFactualLocks(tx) {
  const newborn = await tx.initiative.findUnique({ where: { slug: 'emergency-neonatal-medical-aid' } });
  if (newborn) {
    await tx.initiative.update({
      where: { id: newborn.id },
      data: {
        primaryMetric: '₹107,520',
        summary: newborn.summary?.replaceAll('₹107,200', '₹107,520'),
        story: newborn.story?.replaceAll('₹107,200', '₹107,520'),
      },
    });
  }

  const winterSummary =
    'During the 2025–26 winter season, Amaana Foundation distributed 234 Winter Kits to 234 beneficiaries through a multi-phase Winter Drive. The support included sweaters, blankets and beanie caps for madrasa students, orphan children, widows, daily-wage labourers, domestic workers and other people facing seasonal hardship.';
  const winterStory =
    'During the 2025–26 winter season, Amaana Foundation distributed 234 Winter Kits to 234 beneficiaries through a multi-phase Winter Drive. The support included sweaters, blankets and beanie caps for madrasa students, orphan children, widows, daily-wage labourers, domestic workers and other people facing seasonal hardship.\n\nIn Phase 1, support was distributed at Al Madarsatul Islamia LiTahfizil Quranil Kareem, FeelKhana, Mallepally, reaching 96 madrasa students, including boys and girls from approximately ages 2 to 18 and underprivileged orphan children. In Phase 2, Amaana worked in collaboration with Al Khair Society at Al Khair Masjid, Hyderabad, where 101 Winter Kits were distributed. These phase figures are supporting sub-measures within the overall drive and must not be added to the overall total of 234 Winter Kits distributed to 234 beneficiaries.';
  const winterFacts = [
    'Overall: 234 Winter Kits distributed to 234 beneficiaries.',
    'Phase 1: 96 madrasa students.',
    'Phase 2: 101 Winter Kits.',
    'Phase figures are supporting sub-measures within the overall drive and must not be added to 234.',
  ];

  const winter = await tx.initiative.findUnique({ where: { slug: 'winter-relief' } });
  if (winter) {
    await tx.initiative.update({
      where: { id: winter.id },
      data: {
        primaryMetric: '234 Winter Kits',
        primaryMetricLabel: 'distributed to 234 beneficiaries',
        summary: winterSummary,
        story: winterStory,
        financialSummary: {
          ...(winter.financialSummary || {}),
          facts: winterFacts,
          dataCaveat: null,
        },
      },
    });
  }

  await tx.initiative.updateMany({
    where: { slug: { in: ['winter-drive-2025-26', 'winter-relief-2025-26'] } },
    data: {
      primaryMetric: '234 Winter Kits',
      primaryMetricLabel: 'distributed to 234 beneficiaries',
      summary: winterSummary,
      story: winterStory,
    },
  });
}

export async function applyMasterContent(prisma) {
 const master=JSON.parse(await readFile(new URL('./master-programmes.json',import.meta.url),'utf8'));
 return prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(2026091501)`;
  const marker=await tx.initiative.findUnique({where:{slug:'auto-rickshaw-livelihood-support'}});
  if(marker?.financialSummary?.contentVersion===master.version){
   await applyCanonicalFactualLocks(tx);
   return 0;
  }
  const ids=new Map();
  for(const c of master.categories){const row=await tx.cause.upsert({where:{slug:c.slug},create:{...c,status:'PUBLISHED',publishedAt:new Date()},update:c});ids.set(c.slug,row.id);}
  for(const [displayOrder,record] of master.initiatives.entries()){
   const {causeSlug,parentSlug,programmeStatus,facts,dataCaveat,...copy}=record;
   const existing=await tx.initiative.findUnique({where:{slug:copy.slug}});
   const data={...copy,causeId:ids.get(causeSlug),displayOrder,isFeatured:!parentSlug,financialSummary:{...(existing?.financialSummary||{}),contentVersion:master.version,parentSlug:parentSlug||null,programmeStatus,facts:facts||[],dataCaveat:dataCaveat||null}};
   await tx.initiative.upsert({where:{slug:copy.slug},create:{...data,status:'PUBLISHED',publishedAt:new Date()},update:data});
  }
  // Preserve all IDs and media. Move only known legacy categories into the new umbrellas.
  const legacy={'seasonal-food-support':'ramadan-eid','education':'amaana-taleem','education-support':'amaana-taleem','medical-financial-assistance':'medical-financial-relief','emergency-relief':'emergency-humanitarian-relief','seasonal-support':'seasonal-relief'};
  for(const [old,target] of Object.entries(legacy)){const c=await tx.cause.findUnique({where:{slug:old}});if(!c)continue;await tx.initiative.updateMany({where:{causeId:c.id},data:{causeId:ids.get(target)}});await tx.appeal.updateMany({where:{causeId:c.id},data:{causeId:ids.get(target)}});await tx.story.updateMany({where:{causeId:c.id},data:{causeId:ids.get(target)}});await tx.cause.update({where:{id:c.id},data:{status:'ARCHIVED'}});}
  await tx.initiative.updateMany({where:{slug:{in:['winter-drive-2025-26','winter-relief-2025-26']}},data:{causeId:ids.get('seasonal-relief'),primaryMetric:'96 students',primaryMetricLabel:'Phase 1 · 101 Winter Kits in Phase 2',summary:master.initiatives.find(i=>i.slug==='winter-relief').summary,story:master.initiatives.find(i=>i.slug==='winter-relief').story}});
  const winter=await tx.initiative.findUnique({where:{slug:'winter-relief'}});
  for(const slug of ['winter-drive-2025-26','winter-relief-2025-26']){const legacyWinter=await tx.initiative.findUnique({where:{slug}});if(winter&&legacyWinter)await tx.mediaAsset.updateMany({where:{initiativeId:legacyWinter.id},data:{initiativeId:winter.id}});}
  const assets=JSON.parse(await readFile(new URL('./integration-media.json',import.meta.url),'utf8'));
  for(const asset of assets){const initiative=await tx.initiative.findUnique({where:{slug:asset.slug}});if(!initiative)continue;if(await tx.mediaAsset.findFirst({where:{initiativeId:initiative.id,publicUrl:asset.url}}))continue;await tx.mediaAsset.create({data:{initiativeId:initiative.id,kind:'IMAGE',publicUrl:asset.url,title:asset.alt,altText:asset.alt,caption:asset.caption,sourcePath:asset.source,sourceYear:asset.year,sortOrder:-20+assets.indexOf(asset),isPublic:true,privacyApprovedAt:new Date()}});}
  const medical=master.categories[0];
  await tx.initiative.updateMany({where:{slug:'medical-financial-assistance'},data:{title:medical.title,summary:medical.summary,story:medical.description,primaryMetric:null,primaryMetricLabel:null}});
  await applyCanonicalFactualLocks(tx);
  return master.initiatives.length;
 },{timeout:180000,maxWait:10000});
}
