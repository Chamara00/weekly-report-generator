import type { PrismaService } from '../prisma/prisma.service';

/**
 * A hand-rolled PrismaService double.
 *
 * The services under test do authorization and state-machine work; none of that
 * needs a real database, and a mock keeps these tests fast and deterministic.
 * What the tests assert on is which Prisma calls were made -- e.g. that editing
 * a DRAFT calls reportVersion.update and NOT reportVersion.create.
 */
export interface MockPrisma {
  user: {
    count: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  report: {
    findUnique: jest.Mock;
    findUniqueOrThrow: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    groupBy: jest.Mock;
  };
  reportVersion: { create: jest.Mock; update: jest.Mock; findFirst: jest.Mock };
  reviewComment: { create: jest.Mock };
  task: { deleteMany: jest.Mock };
  plannedTask: { deleteMany: jest.Mock };
  blocker: { deleteMany: jest.Mock; count: jest.Mock };
  achievement: { deleteMany: jest.Mock };
  hoursByType: { deleteMany: jest.Mock };
  $transaction: jest.Mock;
  $queryRaw: jest.Mock;
}

export function createMockPrisma(): MockPrisma {
  const mock: MockPrisma = {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    report: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      groupBy: jest.fn(),
    },
    reportVersion: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    reviewComment: { create: jest.fn() },
    task: { deleteMany: jest.fn() },
    plannedTask: { deleteMany: jest.fn() },
    blocker: { deleteMany: jest.fn(), count: jest.fn() },
    achievement: { deleteMany: jest.fn() },
    hoursByType: { deleteMany: jest.fn() },

    // Supports both forms the services use: an array of promises, and an
    // interactive callback that receives a transaction client.
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  };

  mock.$transaction.mockImplementation(
    async (arg: unknown[] | ((tx: MockPrisma) => Promise<unknown>)) => {
      if (typeof arg === 'function') {
        return arg(mock);
      }
      return Promise.all(arg);
    },
  );

  return mock;
}

/** The cast every spec needs: the mock stands in for the real service. */
export const asPrismaService = (mock: MockPrisma): PrismaService =>
  mock as unknown as PrismaService;

/**
 * Reads the first argument of a mock's first call, typed.
 *
 * jest.Mock.calls is `any[][]`, so every direct index read trips
 * no-unsafe-member-access. This keeps the assertions in the specs clean.
 */
export function firstCallArg<T>(mock: jest.Mock, callIndex = 0): T {
  const calls = mock.mock.calls as unknown[][];
  return calls[callIndex]?.[0] as T;
}
