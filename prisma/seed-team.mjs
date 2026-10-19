import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const groups = [
  { key: "TRUSTEES", title: "Trustees", description: "Responsible for governance, accountability and the direction of the Foundation.", sortOrder: 10 },
  { key: "FINANCE_COMPLIANCE", title: "Finance & Compliance", description: "Keeping the Foundation's accounts and filings accurate and transparent.", sortOrder: 20 },
  { key: "COMMUNICATIONS", title: "Communications & Outreach", description: "Sharing the Foundation's work and keeping supporters informed.", sortOrder: 30 },
  { key: "TECHNOLOGY", title: "Technology", description: "Building and maintaining the Foundation's website and digital systems.", sortOrder: 40 },
  { key: "ADVISORS", title: "Advisors", description: "Long-standing supporters who offer guidance and help sustain the Foundation's work.", sortOrder: 50 },
];

const members = [
  ["mohammed-mazhar-khan", "Mohammed Mazhar Khan", "Founder & Managing Trustee", "TRUSTEES", 10],
  ["mohammed-ather-khan", "Mohammed Ather Khan", "Trustee & Treasurer", "TRUSTEES", 20],
  ["syed-uqba-ali", "Syed Uqba Ali", "Trustee", "TRUSTEES", 30],
  ["jaffar-mohammed-khan", "Jaffar Mohammed Khan", "Chartered Accountant", "FINANCE_COMPLIANCE", 10],
  ["mohammed-ismail-khan-ca", "Mohammed Ismail Khan", "Chartered Accountant", "FINANCE_COMPLIANCE", 20],
  ["asma-sultana", "Asma Sultana", "Communications Lead", "COMMUNICATIONS", 10],
  ["mohammed-ismail-khan-web", "Mohammed Ismail Khan", "Web Developer", "TECHNOLOGY", 10],
  ["abdul-haseeb", "Abdul Haseeb", "Web Developer", "TECHNOLOGY", 20],
  ["mohammed-azher-khan", "Mohammed Azher Khan", "Advisor", "ADVISORS", 10],
  ["mohammed-akbar-khan", "Mohammed Akbar Khan", "Advisor", "ADVISORS", 20],
];

async function seedTeam() {
  // skipDuplicates preserves both existing identities and later admin edits.
  await prisma.teamGroup.createMany({ data: groups, skipDuplicates: true });
  const found = await prisma.teamGroup.findMany({ select: { id: true, key: true } });
  const groupIds = new Map(found.map(group => [group.key, group.id]));

  await prisma.teamMember.createMany({
    skipDuplicates: true,
    data: members.map(([slug, fullName, designation, key, sortOrder]) => {
      const groupId = groupIds.get(key);
      if (!groupId) throw new Error(`Missing seed team group: ${key}`);
      return { slug, fullName, designation, groupId, sortOrder, isPublished: true };
    }),
  });
  console.log("Team directory initialized without overwriting existing records.");
}

try {
  await seedTeam();
} finally {
  await prisma.$disconnect();
}
