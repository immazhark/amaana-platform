import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt as nodeScrypt } from "node:crypto";
import { promisify } from "node:util";

const prisma = new PrismaClient();
const scrypt = promisify(nodeScrypt);

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${Buffer.from(derived).toString("hex")}`;
}

const permissions = [
  ["assistance.view", "View assistance requests and private documents"],
  ["assistance.assign", "Assign assistance requests to staff"],
  ["assistance.update", "Update request status and internal notes"],
  ["assistance.approve", "Approve or reject verified assistance requests"],
  ["appeal.create", "Convert approved requests into draft appeals"],
  ["appeal.approve", "Approve appeals for publication"],
  ["rbac.manage", "Manage staff access and permissions"],
];

const roles = {
  PRIMARY_APPROVER: permissions.map(([key]) => key),
  BACKUP_APPROVER: ["assistance.view", "assistance.assign", "assistance.update", "assistance.approve", "appeal.create", "appeal.approve"],
  REVIEWER: ["assistance.view", "assistance.update"],
};

for (const [key, description] of permissions) await prisma.permission.upsert({ where: { key }, update: { description }, create: { key, description } });
for (const [name, keys] of Object.entries(roles)) {
  const role = await prisma.role.upsert({ where: { name }, update: {}, create: { name, description: name.replaceAll("_", " ").toLowerCase() } });
  const saved = await prisma.permission.findMany({ where: { key: { in: keys } } });
  await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
  await prisma.rolePermission.createMany({ data: saved.map(permission => ({ roleId: role.id, permissionId: permission.id })) });
}

const staff = [
  { name: "Mohammed Mazhar Khan", role: "PRIMARY_APPROVER", email: process.env.ADMIN_MAZHAR_EMAIL, password: process.env.ADMIN_MAZHAR_PASSWORD },
  { name: "Mohammed Ather Khan", role: "BACKUP_APPROVER", email: process.env.ADMIN_ATHER_EMAIL, password: process.env.ADMIN_ATHER_PASSWORD },
  { name: "Asma Sultana", role: "REVIEWER", email: process.env.ADMIN_ASMA_EMAIL, password: process.env.ADMIN_ASMA_PASSWORD },
];

for (const member of staff) {
  if (!member.email || !member.password) { console.warn(`Skipping ${member.name}: email or password is missing.`); continue; }
  if (member.password.length < 12) throw new Error(`${member.name}'s initial password must contain at least 12 characters.`);
  const role = await prisma.role.findUniqueOrThrow({ where: { name: member.role } });
  const user = await prisma.user.upsert({ where: { email: member.email.toLowerCase() }, update: { name: member.name, status: "ACTIVE" }, create: { name: member.name, email: member.email.toLowerCase(), status: "ACTIVE" } });
  await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: role.id } }, update: {}, create: { userId: user.id, roleId: role.id } });
  const passwordHash = await hashPassword(member.password);
  await prisma.passwordCredential.upsert({ where: { userId: user.id }, update: { passwordHash }, create: { userId: user.id, passwordHash } });
}

await prisma.$disconnect();
console.log("RBAC permissions, roles and configured staff accounts are ready.");
