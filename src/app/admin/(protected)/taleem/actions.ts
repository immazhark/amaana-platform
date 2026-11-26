"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import {
  RosterError, assignLearner, confirmHifdhEvidence, createLearner, createPlace, endAssignment, recordHifdhCompletion, setLearnerStatus, setPlaceStatus, startEnrolment,
} from "@/lib/taleem-roster-service";

const ROSTER_PATH = "/admin/taleem";
// Learner records are private beneficiary data, so they sit behind the approver permission already used for sensitive
// beneficiary decisions. No new permission is introduced. The key is written out at each call so the reviewed
// permission matrix can see it.
// One value per field; repeated or non-text fields are rejected rather than guessed at.
function field(formData: FormData, name: string): string {
  const values = formData.getAll(name);
  if (values.length > 1) throw new Error(`Repeated ${name} fields are not accepted.`);
  const value = values[0];
  if (value === undefined) return "";
  if (typeof value !== "string") throw new Error(`Use a single text ${name} field.`);
  return value;
}

async function finish(work: () => Promise<string>): Promise<never> {
  let message: string;
  try {
    message = await work();
  } catch (error) {
    if (!(error instanceof RosterError)) throw error;
    message = error.message;
  }
  revalidatePath(ROSTER_PATH);
  redirect(`${ROSTER_PATH}?notice=${encodeURIComponent(message)}`);
}

export async function createLearnerAction(formData: FormData) {
  const user = await requirePermission("assistance.approve");
  return finish(async () => {
    const created = await createLearner({ fullName: field(formData, "fullName"), provenance: field(formData, "provenance") }, user.id);
    return `Learner added with reference ${created.publicAlias}.`;
  });
}

export async function setLearnerStatusAction(formData: FormData) {
  const user = await requirePermission("assistance.approve");
  return finish(async () => {
    await setLearnerStatus(field(formData, "learnerId"), field(formData, "status"), user.id);
    return "Learner status updated.";
  });
}

export async function startEnrolmentAction(formData: FormData) {
  const user = await requirePermission("assistance.approve");
  return finish(async () => {
    await startEnrolment(field(formData, "learnerId"), field(formData, "programme"), field(formData, "startedOn"), user.id);
    return "Programme recorded.";
  });
}

export async function createPlaceAction(formData: FormData) {
  const user = await requirePermission("assistance.approve");
  return finish(async () => {
    const created = await createPlace({ approvedOn: field(formData, "approvedOn"), note: field(formData, "note") }, user.id);
    return `Place added with code ${created.placeCode}.`;
  });
}

export async function setPlaceStatusAction(formData: FormData) {
  const user = await requirePermission("assistance.approve");
  return finish(async () => {
    await setPlaceStatus(field(formData, "placeId"), field(formData, "status"), user.id);
    return "Place status updated.";
  });
}

export async function assignLearnerAction(formData: FormData) {
  const user = await requirePermission("assistance.approve");
  return finish(async () => {
    await assignLearner(field(formData, "placeId"), field(formData, "learnerId"), field(formData, "startedOn"), user.id);
    return "Place assigned.";
  });
}

export async function endAssignmentAction(formData: FormData) {
  const user = await requirePermission("assistance.approve");
  return finish(async () => {
    await endAssignment(field(formData, "assignmentId"), field(formData, "endedOn"), field(formData, "reason"), user.id);
    return "Assignment ended; the history is kept.";
  });
}

export async function recordHifdhCompletionAction(formData: FormData) {
  const user = await requirePermission("assistance.approve");
  return finish(async () => {
    await recordHifdhCompletion(field(formData, "learnerId"), field(formData, "completedOn"), {
      supportAssociated: field(formData, "supportAssociated") === "yes",
      verified: field(formData, "verified") === "yes",
    }, user.id);
    return "Hifdh completion recorded. It does not end any support; do that separately if appropriate.";
  });
}

export async function confirmHifdhEvidenceAction(formData: FormData) {
  const user = await requirePermission("assistance.approve");
  return finish(async () => {
    const verified = field(formData, "verified");
    const supportAssociated = field(formData, "supportAssociated");
    if (![verified, supportAssociated].every(value => value === "" || value === "on")) throw new RosterError("Choose valid evidence confirmations.");
    const result = await confirmHifdhEvidence(field(formData, "learnerId"), {
      verified: verified === "on", supportAssociated: supportAssociated === "on",
    }, user.id);
    return result === "unchanged" ? "That evidence was already confirmed." : "Hifdh evidence confirmed. No public figure or assignment was changed.";
  });
}
