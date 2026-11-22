-- Taleem roster: private records of learners, sponsored places, who holds a place when, programme history and Hifdh
-- completions (brief v1.1 section 9). Additive: new enums and tables only; no existing row or column changes, and
-- nothing is seeded (the real roster is entered through the admin by Amaana).
--
-- The database itself refuses the states the counting rules forbid, so no code path can create them by mistake.

-- CreateEnum
CREATE TYPE "TaleemProgrammeKind" AS ENUM ('QAIDA', 'NAZIRA', 'HIFDH');

-- CreateEnum
CREATE TYPE "TaleemLearnerStatus" AS ENUM ('ACTIVE', 'ON_BREAK', 'LEFT', 'GRADUATED');

-- CreateEnum
CREATE TYPE "TaleemPlaceStatus" AS ENUM ('MAINTAINED', 'SUSPENDED', 'RETIRED');

-- CreateEnum
CREATE TYPE "TaleemMilestoneKind" AS ENUM ('HIFDH_COMPLETION');

-- CreateTable
CREATE TABLE "TaleemLearner" (
    "id" TEXT NOT NULL,
    "publicAlias" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "status" "TaleemLearnerStatus" NOT NULL DEFAULT 'ACTIVE',
    "provenance" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaleemLearner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaleemEnrolment" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "programme" "TaleemProgrammeKind" NOT NULL,
    "startedOn" DATE NOT NULL,
    "endedOn" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaleemEnrolment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaleemPlace" (
    "id" TEXT NOT NULL,
    "placeCode" TEXT NOT NULL,
    "status" "TaleemPlaceStatus" NOT NULL DEFAULT 'MAINTAINED',
    "approvedOn" DATE,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaleemPlace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaleemPlaceAssignment" (
    "id" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "startedOn" DATE NOT NULL,
    "endedOn" DATE,
    "endReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaleemPlaceAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaleemMilestone" (
    "id" TEXT NOT NULL,
    "learnerId" TEXT NOT NULL,
    "kind" "TaleemMilestoneKind" NOT NULL,
    "completedOn" DATE NOT NULL,
    "supportAssociated" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaleemMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaleemLearner_publicAlias_key" ON "TaleemLearner"("publicAlias");

-- CreateIndex
CREATE INDEX "TaleemLearner_status_idx" ON "TaleemLearner"("status");

-- CreateIndex
CREATE INDEX "TaleemEnrolment_learnerId_startedOn_idx" ON "TaleemEnrolment"("learnerId", "startedOn");

-- CreateIndex
CREATE INDEX "TaleemEnrolment_programme_endedOn_idx" ON "TaleemEnrolment"("programme", "endedOn");

-- CreateIndex
CREATE UNIQUE INDEX "TaleemPlace_placeCode_key" ON "TaleemPlace"("placeCode");

-- CreateIndex
CREATE INDEX "TaleemPlace_status_idx" ON "TaleemPlace"("status");

-- CreateIndex
CREATE INDEX "TaleemPlaceAssignment_placeId_startedOn_idx" ON "TaleemPlaceAssignment"("placeId", "startedOn");

-- CreateIndex
CREATE INDEX "TaleemPlaceAssignment_learnerId_startedOn_idx" ON "TaleemPlaceAssignment"("learnerId", "startedOn");

-- CreateIndex
CREATE INDEX "TaleemMilestone_kind_completedOn_idx" ON "TaleemMilestone"("kind", "completedOn");

-- CreateIndex
CREATE UNIQUE INDEX "TaleemMilestone_learnerId_kind_key" ON "TaleemMilestone"("learnerId", "kind");

-- AddForeignKey
ALTER TABLE "TaleemEnrolment" ADD CONSTRAINT "TaleemEnrolment_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "TaleemLearner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaleemPlaceAssignment" ADD CONSTRAINT "TaleemPlaceAssignment_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "TaleemPlace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaleemPlaceAssignment" ADD CONSTRAINT "TaleemPlaceAssignment_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "TaleemLearner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaleemMilestone" ADD CONSTRAINT "TaleemMilestone_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "TaleemLearner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Dates run forward: a period never ends before it starts.
ALTER TABLE "TaleemEnrolment" ADD CONSTRAINT "TaleemEnrolment_period_forward" CHECK ("endedOn" IS NULL OR "endedOn" >= "startedOn");
ALTER TABLE "TaleemPlaceAssignment" ADD CONSTRAINT "TaleemPlaceAssignment_period_forward" CHECK ("endedOn" IS NULL OR "endedOn" >= "startedOn");

-- A learner is on exactly one programme at a time: at most one open enrolment each.
CREATE UNIQUE INDEX "TaleemEnrolment_one_open_per_learner" ON "TaleemEnrolment"("learnerId") WHERE "endedOn" IS NULL;

-- A place has at most one current holder, and a learner holds at most one place at a time. Together these make double
-- coverage impossible even under concurrent requests.
CREATE UNIQUE INDEX "TaleemPlaceAssignment_one_open_per_place" ON "TaleemPlaceAssignment"("placeId") WHERE "endedOn" IS NULL;
CREATE UNIQUE INDEX "TaleemPlaceAssignment_one_open_per_learner" ON "TaleemPlaceAssignment"("learnerId") WHERE "endedOn" IS NULL;

-- Public aliases and place codes are opaque references, never a database id and never sequential: a fixed prefix and
-- random characters from an alphabet without look-alikes.
ALTER TABLE "TaleemLearner" ADD CONSTRAINT "TaleemLearner_alias_shape" CHECK ("publicAlias" ~ '^TL-[A-HJ-NP-Z2-9]{8}$');
ALTER TABLE "TaleemPlace" ADD CONSTRAINT "TaleemPlace_code_shape" CHECK ("placeCode" ~ '^TP-[A-HJ-NP-Z2-9]{6}$');

-- A learner needs a name on record (private, never published).
ALTER TABLE "TaleemLearner" ADD CONSTRAINT "TaleemLearner_name_present" CHECK (length(btrim("fullName")) > 0);
