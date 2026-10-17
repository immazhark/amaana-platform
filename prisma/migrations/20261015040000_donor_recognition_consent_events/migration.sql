-- Receipt-authenticated voluntary Shukr consent event history.
-- Deliberately contains NO name, phone, email, receipt token, IP or
-- free-text metadata. Processing is subject to the private donor
-- data-rights/retention policy, separate from public name publication.
CREATE TABLE "DonorRecognitionConsentEvent" (
  "id" TEXT NOT NULL,
  "donationId" TEXT NOT NULL,
  "action" VARCHAR(16) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DonorRecognitionConsentEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DonorRecognitionConsentEvent_action_chk"
    CHECK ("action" IN ('REQUESTED', 'WITHDRAWN')),
  CONSTRAINT "DonorRecognitionConsentEvent_donationId_fkey"
    FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "DonorRecognitionConsentEvent_donationId_createdAt_idx"
  ON "DonorRecognitionConsentEvent"("donationId", "createdAt");
