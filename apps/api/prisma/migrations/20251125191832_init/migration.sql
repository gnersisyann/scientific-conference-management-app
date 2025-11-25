-- CreateTable
CREATE TABLE "Scientist" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "degree" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "organization" TEXT NOT NULL,

    CONSTRAINT "Scientist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conference" (
    "id" SERIAL NOT NULL,
    "topic" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "country" TEXT NOT NULL,
    "location" TEXT NOT NULL,

    CONSTRAINT "Conference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participation" (
    "id" SERIAL NOT NULL,
    "talkTitle" TEXT NOT NULL,
    "participationType" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "scientistId" INTEGER NOT NULL,
    "conferenceId" INTEGER NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "Participation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Participation_scientistId_idx" ON "Participation"("scientistId");

-- CreateIndex
CREATE INDEX "Participation_conferenceId_idx" ON "Participation"("conferenceId");

-- AddForeignKey
ALTER TABLE "Participation" ADD CONSTRAINT "Participation_scientistId_fkey" FOREIGN KEY ("scientistId") REFERENCES "Scientist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participation" ADD CONSTRAINT "Participation_conferenceId_fkey" FOREIGN KEY ("conferenceId") REFERENCES "Conference"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
