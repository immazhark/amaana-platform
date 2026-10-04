import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';

const database = new URL(process.env.DATABASE_URL ?? 'file://missing');
if (process.env.CI !== 'true' || process.env.AMAANA_UI_AUDIT_TARGET !== 'isolated-ci' || database.protocol !== 'postgresql:' || database.hostname !== 'postgres' || database.pathname !== '/amaana') {
  throw new Error('UI audit records may only be created in the disposable GitHub CI PostgreSQL service.');
}
const prisma = new PrismaClient();
const hash = value => createHash('sha256').update(value).digest('hex');
try {
  const permissions = ['assistance.view','assistance.assign','assistance.update','assistance.approve','appeal.create','appeal.view','appeal.update','appeal.approve','content.view','content.update','content.approve','donation.view','donation.reconcile','notification.view','notification.manage','rbac.manage'];
  const role = await prisma.role.upsert({where:{name:'UI_AUDIT_ONLY'},update:{},create:{name:'UI_AUDIT_ONLY',description:'Disposable UI audit role'}});
  for (const key of permissions) {
    const permission = await prisma.permission.upsert({where:{key},update:{},create:{key,description:'Isolated UI audit permission'}});
    await prisma.rolePermission.upsert({where:{roleId_permissionId:{roleId:role.id,permissionId:permission.id}},update:{},create:{roleId:role.id,permissionId:permission.id}});
  }
  const user = await prisma.user.upsert({where:{email:'ui-audit@example.invalid'},update:{status:'ACTIVE'},create:{email:'ui-audit@example.invalid',name:'Synthetic audit administrator',status:'ACTIVE'}});
  await prisma.userRole.upsert({where:{userId_roleId:{userId:user.id,roleId:role.id}},update:{},create:{userId:user.id,roleId:role.id}});
  const token = randomBytes(32).toString('base64url');
  await prisma.session.create({data:{userId:user.id,tokenHash:hash(token),expiresAt:new Date(Date.now()+3600000)}});
  const now = new Date();
  const appealData = {title:'Synthetic UI audit appeal',summary:'Disposable browser audit content for layout and accessibility checks.',story:'This synthetic record contains no real beneficiary, financial transaction or request. It exists only inside the disposable browser acceptance database.',category:'OTHER',status:'FUNDED',beneficiaryName:'Synthetic applicant',goalAmount:'1000',publishedAt:now,createdById:user.id};
  const appeal = await prisma.appeal.upsert({where:{slug:'synthetic-ui-audit'},update:appealData,create:{slug:'synthetic-ui-audit',...appealData}});
  const draft = await prisma.appeal.upsert({where:{slug:'synthetic-ui-audit-draft'},update:{...appealData,title:'Synthetic draft editor audit',status:'DRAFT',publishedAt:null},create:{slug:'synthetic-ui-audit-draft',...appealData,title:'Synthetic draft editor audit',status:'DRAFT',publishedAt:null}});
  const requestData = {applicantName:'Synthetic applicant',phone:'+910000000000',city:'Hyderabad',category:'OTHER',description:'Synthetic UI audit request. No real beneficiary data or documents.',consentGivenAt:now,trackingTokenHash:hash('synthetic-ui-audit-tracking-token'),assignedToId:user.id};
  const request = await prisma.assistanceRequest.upsert({where:{referenceNumber:'AMA-UI-AUDIT'},update:requestData,create:{referenceNumber:'AMA-UI-AUDIT',...requestData}});
  const donationData = {appealId:appeal.id,donorName:'Synthetic donor',donorEmail:'ui-audit@example.invalid',domesticConfirmedAt:now,amount:'100',receiptTokenHash:hash('synthetic-only'),status:'CREATED'};
  const donation = await prisma.donation.upsert({where:{referenceNumber:'AFD-UI-AUDIT'},update:donationData,create:{referenceNumber:'AFD-UI-AUDIT',...donationData}});
  const storyData = {title:'Synthetic editorial audit story',summary:'Disposable content for the article layout audit.',body:'This is synthetic editorial content, created only for layout and accessibility testing in a disposable database. No claim about Amaana programmes or beneficiaries is made.',status:'PUBLISHED',publishedAt:now,privacyApprovedAt:now};
  await prisma.story.upsert({where:{slug:'synthetic-ui-audit-story'},update:storyData,create:{slug:'synthetic-ui-audit-story',...storyData}});
  const faithData = {type:'ARTICLE',title:'Synthetic reading layout audit',excerpt:'Synthetic content for reading layout checks.',body:'This is a layout test containing no religious quotation or guidance. It is available only in the disposable acceptance database.',status:'PUBLISHED',religiousReviewStatus:'VERIFIED',sourceCitation:'Synthetic layout fixture; no religious quotation or guidance.',verifiedAt:now,publishedAt:now};
  await prisma.faithContent.upsert({where:{slug:'synthetic-ui-audit-reading'},update:faithData,create:{slug:'synthetic-ui-audit-reading',...faithData}});
  const [initiatives,stories,faith] = await Promise.all([
    prisma.initiative.findMany({where:{status:'PUBLISHED',cause:{status:'PUBLISHED'}},select:{slug:true}}),
    prisma.story.findMany({where:{status:'PUBLISHED',privacyApprovedAt:{not:null}},select:{slug:true}}),
    prisma.faithContent.findMany({where:{status:'PUBLISHED',religiousReviewStatus:'VERIFIED',verifiedAt:{not:null},sourceCitation:{not:null}},select:{slug:true}}),
  ]);
  process.stdout.write(JSON.stringify({token,appealId:appeal.id,draftId:draft.id,requestId:request.id,donationId:donation.id,publicRoutes:[...initiatives.map(i=>'/our-work/'+i.slug),...stories.map(i=>'/stories/'+i.slug),...faith.map(i=>'/faith-and-reflections/'+i.slug),'/appeals/synthetic-ui-audit','/donate/synthetic-ui-audit']}));
} finally { await prisma.$disconnect(); }
