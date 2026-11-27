import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { assertDisposableUiAuditTarget } from './ui-audit-target.mjs';

// This suite never resets the shared audit, approval, rejection or public-story fixtures.
assertDisposableUiAuditTarget(process.env);
const prisma = new PrismaClient();
const hash = value => createHash('sha256').update(value).digest('hex');
try {
  const role = await prisma.role.upsert({where:{name:'WORKBENCH_AUDIT_ONLY'},update:{},create:{name:'WORKBENCH_AUDIT_ONLY',description:'Disposable workbench view role'}});
  for (const key of ['assistance.view','assistance.approve','donation.view']) {
    const permission = await prisma.permission.upsert({where:{key},update:{},create:{key,description:'Isolated workbench permission'}});
    await prisma.rolePermission.upsert({where:{roleId_permissionId:{roleId:role.id,permissionId:permission.id}},update:{},create:{roleId:role.id,permissionId:permission.id}});
  }
  const user = await prisma.user.upsert({where:{email:'workbench-audit@example.invalid'},update:{status:'ACTIVE'},create:{email:'workbench-audit@example.invalid',name:'Synthetic workbench reviewer',status:'ACTIVE'}});
  await prisma.userRole.upsert({where:{userId_roleId:{userId:user.id,roleId:role.id}},update:{},create:{userId:user.id,roleId:role.id}});
  const token = randomBytes(32).toString('base64url');
  await prisma.session.create({data:{userId:user.id,tokenHash:hash(token),expiresAt:new Date(Date.now()+3600000)}});
  const now = new Date();
  const requestData = {applicantName:'Synthetic workbench applicant',city:'Hyderabad',category:'OTHER',consentGivenAt:now,trackingTokenHash:hash('synthetic-workbench-tracking')};
  const workbenchIds = {};
    const data = {...requestData,phone:'+910000000099',email:null,status:'UNDER_VERIFICATION',assignedToId:null,description:'Synthetic workbench history case; no real person or evidence.'};
    const workbench = await prisma.assistanceRequest.upsert({where:{referenceNumber:'AMA-UI-WORKBENCH'},update:data,create:{referenceNumber:'AMA-UI-WORKBENCH',...data}});
    workbenchIds.workbenchRequestId = workbench.id;
    // A pair of non-captured, historical synthetic donations, isolated from the current finance/funnel cohort.
    // No provider IDs, payment attempts, receipts or notifications are generated.
    const historical = new Date('2020-01-02T00:00:00.000Z');
    const paymentData = {donorName:'Synthetic workbench donor',donorEmail:'workbench@example.invalid',domesticConfirmedAt:historical,createdAt:historical,amount:'1',receiptTokenHash:hash('synthetic-workbench-only'),paymentMethod:'RAZORPAY',provider:null,providerOrderId:null,providerPaymentId:null,status:'CREATED'};
    const payment = await prisma.donation.upsert({where:{referenceNumber:'AFD-2020-99000001'},update:paymentData,create:{referenceNumber:'AFD-2020-99000001',...paymentData}});
    const otherPayment = await prisma.donation.upsert({where:{referenceNumber:'AFD-2020-99000002'},update:paymentData,create:{referenceNumber:'AFD-2020-99000002',...paymentData}});
    workbenchIds.workbenchPaymentId = payment.id;
    await prisma.paymentEvent.createMany({data:[
      ...Array.from({length:51},(_,i)=>{
        const suffix=String(i+1).padStart(2,'0');
        return {id:'ui-workbench-payment-'+suffix,providerEventId:'synthetic-workbench-event-'+suffix,eventType:'payment.authorized',donationId:payment.id,processedAt:historical,payload:{synthetic:'PRIVATE_SYNTHETIC_EVENT_PAYLOAD'}};
      }),
      {id:'ui-workbench-payment-decoy',providerEventId:'synthetic-other-donation-event',eventType:'payment.authorized',donationId:otherPayment.id,processedAt:historical,payload:{synthetic:true}},
    ],skipDuplicates:true});
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    await prisma.auditEvent.createMany({data:Array.from({length:51},(_,i)=>{
      const suffix=String(i+1).padStart(2,'0');
      return {id:'ui-workbench-history-'+suffix,actorId:user.id,action:'workbench_change_'+suffix,entityType:'AssistanceRequest',entityId:workbench.id,createdAt};
    }),skipDuplicates:true});
    const current = await prisma.taleemLearner.upsert({where:{publicAlias:'TL-WKBNCHAA'},update:{status:'ACTIVE'},create:{publicAlias:'TL-WKBNCHAA',fullName:'Synthetic Workbench Current Learner',status:'ACTIVE',provenance:'Isolated CI workbench'}});
    const other = await prisma.taleemLearner.upsert({where:{publicAlias:'TL-WKBNCHAB'},update:{status:'GRADUATED'},create:{publicAlias:'TL-WKBNCHAB',fullName:'Synthetic Workbench Graduated Learner',status:'GRADUATED',provenance:'Isolated CI workbench'}});
    const place = await prisma.taleemPlace.upsert({where:{placeCode:'TP-WKBCHA'},update:{status:'MAINTAINED'},create:{placeCode:'TP-WKBCHA',status:'MAINTAINED'}});
    const startedOn = new Date('2020-01-01T00:00:00.000Z');
    await prisma.taleemEnrolment.upsert({where:{id:'ui-workbench-enrolment-a'},update:{},create:{id:'ui-workbench-enrolment-a',learnerId:current.id,programme:'NAZIRA',startedOn}});
    await prisma.taleemEnrolment.upsert({where:{id:'ui-workbench-enrolment-b'},update:{},create:{id:'ui-workbench-enrolment-b',learnerId:other.id,programme:'HIFDH',startedOn}});
    await prisma.taleemPlaceAssignment.upsert({where:{id:'ui-workbench-assignment-a'},update:{},create:{id:'ui-workbench-assignment-a',learnerId:current.id,placeId:place.id,startedOn}});
  const claimData = {donorName:'Synthetic workbench claimant',donorEmail:'workbench@example.invalid',domesticConfirmedAt:now,amount:'100',receiptTokenHash:hash('synthetic-workbench-claim'),paymentMethod:'DIRECT_UPI',status:'PENDING_VERIFICATION',transferReference:'UI-WORKBENCH-SYNTHETIC-ONLY',transferredAt:now};
  await prisma.donation.upsert({where:{referenceNumber:'AFD-UI-WORKBENCH'},update:claimData,create:{referenceNumber:'AFD-UI-WORKBENCH',...claimData}});
  process.stdout.write(JSON.stringify({...workbenchIds,token}));
} finally { await prisma.$disconnect(); }
