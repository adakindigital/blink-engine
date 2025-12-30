-- CreateTable
CREATE TABLE "mission_feedback" (
    "id" TEXT NOT NULL,
    "sosEventId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mission_feedback_sosEventId_key" ON "mission_feedback"("sosEventId");

-- CreateIndex
CREATE INDEX "mission_feedback_sosEventId_idx" ON "mission_feedback"("sosEventId");

-- CreateIndex
CREATE INDEX "mission_feedback_type_idx" ON "mission_feedback"("type");

-- AddForeignKey
ALTER TABLE "mission_feedback" ADD CONSTRAINT "mission_feedback_sosEventId_fkey" FOREIGN KEY ("sosEventId") REFERENCES "sos_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_feedback" ADD CONSTRAINT "mission_feedback_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
