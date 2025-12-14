-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'STUDENT');

-- CreateEnum
CREATE TYPE "public"."ElectionStatus" AS ENUM ('DRAFT', 'RUNNING', 'ENDED');

-- CreateEnum
CREATE TYPE "public"."ElectionCategory" AS ENUM ('SRC', 'DEPARTMENT');

-- CreateTable
CREATE TABLE "public"."Department" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "studentId" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'STUDENT',
    "passwordHash" TEXT,
    "departmentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Election" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" "public"."ElectionCategory" NOT NULL,
    "status" "public"."ElectionStatus" NOT NULL DEFAULT 'DRAFT',
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "departmentId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Election_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Position" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "maxChoices" INTEGER NOT NULL DEFAULT 1,
    "electionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Candidate" (
    "id" SERIAL NOT NULL,
    "displayName" TEXT NOT NULL,
    "manifesto" TEXT,
    "photoUrl" TEXT,
    "positionId" INTEGER NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Vote" (
    "id" SERIAL NOT NULL,
    "voterId" INTEGER NOT NULL,
    "electionId" INTEGER NOT NULL,
    "positionId" INTEGER NOT NULL,
    "candidateId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VoterKey" (
    "id" SERIAL NOT NULL,
    "keyHash" TEXT NOT NULL,
    "voterId" INTEGER NOT NULL,
    "electionId" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VoterKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LoginOTP" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginOTP_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "public"."Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_studentId_key" ON "public"."User"("studentId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "public"."User"("role");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "public"."User"("departmentId");

-- CreateIndex
CREATE INDEX "Election_status_idx" ON "public"."Election"("status");

-- CreateIndex
CREATE INDEX "Election_category_departmentId_idx" ON "public"."Election"("category", "departmentId");

-- CreateIndex
CREATE INDEX "Position_electionId_idx" ON "public"."Position"("electionId");

-- CreateIndex
CREATE UNIQUE INDEX "Position_electionId_name_key" ON "public"."Position"("electionId", "name");

-- CreateIndex
CREATE INDEX "Candidate_positionId_idx" ON "public"."Candidate"("positionId");

-- CreateIndex
CREATE INDEX "Candidate_userId_idx" ON "public"."Candidate"("userId");

-- CreateIndex
CREATE INDEX "Vote_electionId_idx" ON "public"."Vote"("electionId");

-- CreateIndex
CREATE INDEX "Vote_positionId_idx" ON "public"."Vote"("positionId");

-- CreateIndex
CREATE INDEX "Vote_candidateId_idx" ON "public"."Vote"("candidateId");

-- CreateIndex
CREATE INDEX "Vote_voterId_idx" ON "public"."Vote"("voterId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_voterId_electionId_positionId_key" ON "public"."Vote"("voterId", "electionId", "positionId");

-- CreateIndex
CREATE INDEX "VoterKey_electionId_sentAt_idx" ON "public"."VoterKey"("electionId", "sentAt");

-- CreateIndex
CREATE INDEX "VoterKey_voterId_idx" ON "public"."VoterKey"("voterId");

-- CreateIndex
CREATE UNIQUE INDEX "VoterKey_voterId_electionId_key" ON "public"."VoterKey"("voterId", "electionId");

-- CreateIndex
CREATE INDEX "LoginOTP_email_purpose_createdAt_idx" ON "public"."LoginOTP"("email", "purpose", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Election" ADD CONSTRAINT "Election_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Election" ADD CONSTRAINT "Election_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Position" ADD CONSTRAINT "Position_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "public"."Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Candidate" ADD CONSTRAINT "Candidate_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "public"."Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Candidate" ADD CONSTRAINT "Candidate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vote" ADD CONSTRAINT "Vote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vote" ADD CONSTRAINT "Vote_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "public"."Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vote" ADD CONSTRAINT "Vote_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "public"."Position"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vote" ADD CONSTRAINT "Vote_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "public"."Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VoterKey" ADD CONSTRAINT "VoterKey_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VoterKey" ADD CONSTRAINT "VoterKey_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "public"."Election"("id") ON DELETE CASCADE ON UPDATE CASCADE;
