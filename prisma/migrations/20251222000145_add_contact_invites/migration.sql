-- AlterTable
ALTER TABLE "contacts" ADD COLUMN     "contactUserId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'accepted';

-- CreateTable
CREATE TABLE "contact_invites" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_invites_receiverId_idx" ON "contact_invites"("receiverId");

-- CreateIndex
CREATE INDEX "contact_invites_senderId_idx" ON "contact_invites"("senderId");

-- CreateIndex
CREATE INDEX "contact_invites_status_idx" ON "contact_invites"("status");
