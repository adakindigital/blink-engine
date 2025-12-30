/*
  Warnings:

  - You are about to drop the `security_nodes` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "sos_events" ADD COLUMN     "securityNote" TEXT,
ADD COLUMN     "securityResponderId" TEXT,
ADD COLUMN     "securityStatus" TEXT;

-- DropTable
DROP TABLE "security_nodes";

-- CreateTable
CREATE TABLE "security_companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_personnel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "badgeNumber" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "currentLatitude" DOUBLE PRECISION,
    "currentLongitude" DOUBLE PRECISION,
    "lastLocationUpdate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'offline',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_personnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist_entries" (
    "email" TEXT NOT NULL,
    "name" TEXT,
    "suburb" TEXT,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlist_entries_pkey" PRIMARY KEY ("email")
);

-- CreateIndex
CREATE UNIQUE INDEX "security_personnel_userId_key" ON "security_personnel"("userId");

-- CreateIndex
CREATE INDEX "security_personnel_companyId_idx" ON "security_personnel"("companyId");

-- CreateIndex
CREATE INDEX "security_personnel_status_idx" ON "security_personnel"("status");

-- AddForeignKey
ALTER TABLE "sos_events" ADD CONSTRAINT "sos_events_securityResponderId_fkey" FOREIGN KEY ("securityResponderId") REFERENCES "security_personnel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_personnel" ADD CONSTRAINT "security_personnel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_personnel" ADD CONSTRAINT "security_personnel_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "security_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
