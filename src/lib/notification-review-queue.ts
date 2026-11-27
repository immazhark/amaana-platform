import type { Prisma } from "@prisma/client";
import { NOTIFICATION_OVERDUE_MS, NOTIFICATION_STALE_PROCESSING_MS, TERMINAL_NOTIFICATION_SCHEDULE } from "./operational-signals";

export type NotificationIssue = "stale-processing" | "overdue" | "terminal";
export function notificationIssueWhere(issue: NotificationIssue, now: Date): Prisma.NotificationWhereInput {
  switch (issue) {
    case "stale-processing": return { channel: "EMAIL", status: "PROCESSING", updatedAt: { lt: new Date(now.getTime() - NOTIFICATION_STALE_PROCESSING_MS) } };
    case "overdue": return { channel: "EMAIL", status: { in: ["PENDING", "FAILED"] }, attempts: { lt: 5 }, scheduledFor: { lt: new Date(now.getTime() - NOTIFICATION_OVERDUE_MS) } };
    case "terminal": return { channel: "EMAIL", status: "FAILED", OR: [{ attempts: { gte: 5 } }, { scheduledFor: { gte: TERMINAL_NOTIFICATION_SCHEDULE } }] };
  }
}
export function notificationIssueFilter(value: unknown, now: Date): { issue: NotificationIssue | null; invalid: boolean; where: Prisma.NotificationWhereInput | undefined; query: { issue?: string } } {
  if (value === undefined || value === "") return { issue: null, invalid: false, where: undefined, query: {} };
  if (value === "stale-processing" || value === "overdue" || value === "terminal") return { issue: value, invalid: false, where: notificationIssueWhere(value, now), query: { issue: value } };
  return { issue: null, invalid: true, where: { id: { in: [] } }, query: { issue: "invalid" } };
}
export function notificationQueueOrder(issue: NotificationIssue | null): Prisma.NotificationOrderByWithRelationInput[] {
  if (issue === "overdue") return [{ scheduledFor: "asc" }, { id: "asc" }];
  if (issue === "stale-processing" || issue === "terminal") return [{ updatedAt: "asc" }, { id: "asc" }];
  return [{ status: "asc" }, { createdAt: "desc" }, { id: "desc" }];
}
