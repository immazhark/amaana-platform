-- Commit new direct-transfer workflow states before later constraints reference them.
ALTER TYPE "DonationStatus" ADD VALUE IF NOT EXISTS 'PENDING_VERIFICATION';
ALTER TYPE "DonationStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
