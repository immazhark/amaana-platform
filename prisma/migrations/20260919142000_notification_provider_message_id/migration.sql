-- Store the external email provider's accepted message identifier for
-- operational reconciliation. This value is not a credential and contains no
-- message body, donor, beneficiary or payment data.
ALTER TABLE "Notification"
ADD COLUMN "providerMessageId" TEXT;
