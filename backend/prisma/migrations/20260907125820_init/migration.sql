-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TEAM_MEMBER', 'MANAGER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'NEEDS_CORRECTION', 'APPROVED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'CARRIED_OVER');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('DEVELOPMENT', 'TESTING', 'MEETINGS', 'DOCUMENTATION', 'OTHER');

-- CreateEnum
CREATE TYPE "ReviewAction" AS ENUM ('APPROVE', 'REQUEST_CHANGES');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'TEAM_MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "weekStartDate" DATE NOT NULL,
    "weekEndDate" DATE NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportVersion" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "notes" TEXT,
    "links" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "reportVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "plannedPercent" INTEGER NOT NULL DEFAULT 0,
    "actualPercent" INTEGER NOT NULL DEFAULT 0,
    "status" "TaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "hoursPlanned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hoursSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliverable" TEXT,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlannedTask" (
    "id" TEXT NOT NULL,
    "reportVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "PlannedTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Blocker" (
    "id" TEXT NOT NULL,
    "reportVersionId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isKeyIssue" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Blocker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "reportVersionId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isKeyAchievement" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HoursByType" (
    "id" TEXT NOT NULL,
    "reportVersionId" TEXT NOT NULL,
    "taskType" "TaskType" NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "HoursByType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewComment" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "reportVersionId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "action" "ReviewAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Project_name_key" ON "Project"("name");

-- CreateIndex
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");

-- CreateIndex
CREATE INDEX "ProjectMember_projectId_idx" ON "ProjectMember"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMember_userId_projectId_key" ON "ProjectMember"("userId", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_currentVersionId_key" ON "Report"("currentVersionId");

-- CreateIndex
CREATE INDEX "Report_projectId_idx" ON "Report"("projectId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Report_userId_weekStartDate_key" ON "Report"("userId", "weekStartDate");

-- CreateIndex
CREATE INDEX "ReportVersion_reportId_idx" ON "ReportVersion"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportVersion_reportId_versionNumber_key" ON "ReportVersion"("reportId", "versionNumber");

-- CreateIndex
CREATE INDEX "Task_reportVersionId_idx" ON "Task"("reportVersionId");

-- CreateIndex
CREATE INDEX "PlannedTask_reportVersionId_idx" ON "PlannedTask"("reportVersionId");

-- CreateIndex
CREATE INDEX "Blocker_reportVersionId_idx" ON "Blocker"("reportVersionId");

-- CreateIndex
CREATE INDEX "Achievement_reportVersionId_idx" ON "Achievement"("reportVersionId");

-- CreateIndex
CREATE INDEX "HoursByType_reportVersionId_idx" ON "HoursByType"("reportVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "HoursByType_reportVersionId_taskType_key" ON "HoursByType"("reportVersionId", "taskType");

-- CreateIndex
CREATE INDEX "ReviewComment_reportId_idx" ON "ReviewComment"("reportId");

-- CreateIndex
CREATE INDEX "ReviewComment_reportVersionId_idx" ON "ReviewComment"("reportVersionId");

-- CreateIndex
CREATE INDEX "ReviewComment_managerId_idx" ON "ReviewComment"("managerId");

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "ReportVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportVersion" ADD CONSTRAINT "ReportVersion_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_reportVersionId_fkey" FOREIGN KEY ("reportVersionId") REFERENCES "ReportVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlannedTask" ADD CONSTRAINT "PlannedTask_reportVersionId_fkey" FOREIGN KEY ("reportVersionId") REFERENCES "ReportVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Blocker" ADD CONSTRAINT "Blocker_reportVersionId_fkey" FOREIGN KEY ("reportVersionId") REFERENCES "ReportVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_reportVersionId_fkey" FOREIGN KEY ("reportVersionId") REFERENCES "ReportVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoursByType" ADD CONSTRAINT "HoursByType_reportVersionId_fkey" FOREIGN KEY ("reportVersionId") REFERENCES "ReportVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_reportVersionId_fkey" FOREIGN KEY ("reportVersionId") REFERENCES "ReportVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
