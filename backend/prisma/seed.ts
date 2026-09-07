import { PrismaClient, ReportStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { OVERLOADED_MEMBER, PEOPLE, PROJECTS, SEED_PASSWORD } from './seed/data';
import { buildVersionContent } from './seed/content';
import { REPORT_PLAN, buildReviewSteps } from './seed/plan';
import { daysAfter, formatDate, recentWeeks, submissionTime } from './seed/weeks';

/**
 * Deterministic, idempotent seed. Running it twice produces the same dataset:
 * everything is deleted first, and no value depends on Math.random.
 *
 * Run with:  npx prisma db seed
 */

const prisma = new PrismaClient();
const WEEK_COUNT = 6;

/**
 * Wipe every table before inserting.
 *
 * Deleting the two roots (User, Project) would cascade to most of this, but the
 * deletes are spelled out child-first anyway: it is explicit about the
 * dependency order, and it does not rely on a cascade rule staying as it is.
 * Report is emptied before ReportVersion because Report.currentVersionId points
 * at a version.
 */
async function reset(): Promise<void> {
  await prisma.$transaction([
    prisma.reviewComment.deleteMany(),
    prisma.task.deleteMany(),
    prisma.plannedTask.deleteMany(),
    prisma.blocker.deleteMany(),
    prisma.achievement.deleteMany(),
    prisma.hoursByType.deleteMany(),
    prisma.report.deleteMany(),
    prisma.reportVersion.deleteMany(),
    prisma.projectMember.deleteMany(),
    prisma.project.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

async function seedPeople(): Promise<Map<string, string>> {
  // One hash for everyone: bcrypt is intentionally slow, and hashing the same
  // password seven times would dominate the seed's runtime.
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const ids = new Map<string, string>();

  for (const person of PEOPLE) {
    const user = await prisma.user.create({
      data: {
        email: person.email,
        name: person.name,
        role: person.role,
        passwordHash,
      },
      select: { id: true },
    });
    ids.set(person.key, user.id);
  }

  return ids;
}

async function seedProjects(userIds: Map<string, string>): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const project of PROJECTS) {
    const created = await prisma.project.create({
      data: {
        name: project.name,
        description: project.description,
        members: {
          create: project.members.map((memberKey) => ({
            user: { connect: { id: userIds.get(memberKey)! } },
          })),
        },
      },
      select: { id: true },
    });
    ids.set(project.key, created.id);
  }

  return ids;
}

/**
 * Creates one report, all of its versions, and its review trail.
 *
 * Report.currentVersionId and ReportVersion.reportId reference each other, so
 * neither row can be written with the other's id already in hand. The write is
 * therefore a two-step inside a single transaction:
 *   1. create the Report with currentVersionId still null,
 *   2. create each version (with its content) against that report,
 *   3. update the Report to point at the last version and set its real status.
 * All three commit together, so the database is never left with a report that
 * points at nothing.
 */
async function seedReport(
  entry: (typeof REPORT_PLAN)[number],
  index: number,
  userIds: Map<string, string>,
  projectIds: Map<string, string>,
  managerIds: string[],
  weeks: ReturnType<typeof recentWeeks>,
): Promise<void> {
  const week = weeks[entry.weekIndex];
  const isDraft = entry.status === ReportStatus.DRAFT;

  await prisma.$transaction(
    async (tx) => {
      // Step 1: the envelope, with no version pointer yet.
      const report = await tx.report.create({
        data: {
          userId: userIds.get(entry.memberKey)!,
          projectId: projectIds.get(entry.projectKey)!,
          weekStartDate: week.start,
          weekEndDate: week.end,
          status: ReportStatus.DRAFT,
        },
        select: { id: true },
      });

      // Step 2: one immutable snapshot per version.
      const versionIds: string[] = [];

      for (let versionNumber = 1; versionNumber <= entry.versions; versionNumber += 1) {
        const content = buildVersionContent({
          memberKey: entry.memberKey,
          projectKey: entry.projectKey,
          weekIndex: entry.weekIndex,
          versionNumber,
        });

        // A draft has never been submitted, so submittedAt stays null. The
        // overloaded member submits after the week has closed, which is what
        // gives the compliance panel a non-zero "late" count.
        const submittedAt = isDraft
          ? null
          : submissionTime(week, versionNumber, entry.memberKey === OVERLOADED_MEMBER);

        const version = await tx.reportVersion.create({
          data: {
            reportId: report.id,
            versionNumber,
            notes: content.notes,
            links: content.links,
            submittedAt,
            tasks: { create: content.tasks },
            plannedTasks: { create: content.plannedTasks },
            blockers: { create: content.blockers },
            achievements: { create: content.achievements },
            hoursByType: { create: content.hoursByType },
          },
          select: { id: true },
        });

        versionIds.push(version.id);
      }

      // Step 3: point the report at its newest version and set the real status.
      await tx.report.update({
        where: { id: report.id },
        data: {
          currentVersionId: versionIds[versionIds.length - 1],
          status: entry.status,
        },
      });

      // Each comment records the version the manager was actually looking at.
      for (const step of buildReviewSteps(entry, index)) {
        await tx.reviewComment.create({
          data: {
            reportId: report.id,
            reportVersionId: versionIds[step.versionNumber - 1],
            managerId: managerIds[index % managerIds.length],
            comment: step.comment,
            action: step.action,
            // A review lands a day after the version it comments on.
            createdAt: daysAfter(
              submissionTime(
                week,
                step.versionNumber,
                entry.memberKey === OVERLOADED_MEMBER,
              ),
              1,
            ),
          },
        });
      }
    },
    { timeout: 30_000 },
  );
}

function printLoginTable(): void {
  console.log('\nLogin credentials (all use the password below):\n');
  console.table(
    PEOPLE.map((person) => ({
      Name: person.name,
      Email: person.email,
      Role: person.role,
      Password: SEED_PASSWORD,
    })),
  );
}

async function main(): Promise<void> {
  console.log('Clearing existing data...');
  await reset();

  const userIds = await seedPeople();
  const projectIds = await seedProjects(userIds);
  const managerIds = PEOPLE.filter((p) => p.role === Role.MANAGER).map(
    (p) => userIds.get(p.key)!,
  );
  const weeks = recentWeeks(WEEK_COUNT);

  console.log(
    `Seeding ${PEOPLE.length} users, ${PROJECTS.length} projects and ` +
      `${REPORT_PLAN.length} reports across ${WEEK_COUNT} weeks ` +
      `(${formatDate(weeks[0].start)} to ${formatDate(weeks[weeks.length - 1].end)})...`,
  );

  for (const [index, entry] of REPORT_PLAN.entries()) {
    await seedReport(entry, index, userIds, projectIds, managerIds, weeks);
  }

  const [versionCount, commentCount] = await Promise.all([
    prisma.reportVersion.count(),
    prisma.reviewComment.count(),
  ]);

  const multiVersion = REPORT_PLAN.filter((entry) => entry.versions > 1);
  console.log(
    `\nDone: ${REPORT_PLAN.length} reports, ${versionCount} versions, ` +
      `${commentCount} review comments.`,
  );
  console.log(
    `Reports with multi-version history: ${multiVersion.length} ` +
      `(${multiVersion.map((e) => `${e.memberKey} week ${e.weekIndex + 1} -> v${e.versions}`).join(', ')})`,
  );

  printLoginTable();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
