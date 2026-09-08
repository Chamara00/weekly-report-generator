import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProjectDto,
  ProjectMemberDto,
  UpdateProjectDto,
} from './dto/project.dto';

/** Postgres unique-constraint violation, surfaced by Prisma. */
const UNIQUE_VIOLATION = 'P2002';

const PROJECT_SELECT = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { reports: true, members: true } },
} satisfies Prisma.ProjectSelect;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.project.findMany({
      select: PROJECT_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: {
        ...PROJECT_SELECT,
        members: {
          select: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async create(dto: CreateProjectDto) {
    try {
      return await this.prisma.project.create({
        data: { name: dto.name, description: dto.description },
        select: PROJECT_SELECT,
      });
    } catch (error) {
      // Let the database decide uniqueness rather than checking first: a
      // check-then-insert can still lose a race between two requests.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_VIOLATION
      ) {
        throw new ConflictException(
          `A project named "${dto.name}" already exists`,
        );
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);

    try {
      return await this.prisma.project.update({
        where: { id },
        data: { name: dto.name, description: dto.description },
        select: PROJECT_SELECT,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_VIOLATION
      ) {
        throw new ConflictException(
          `A project named "${dto.name}" already exists`,
        );
      }
      throw error;
    }
  }

  /**
   * Deletes a project only when nothing is filed against it.
   *
   * Report.projectId uses onDelete: Restrict, so the database would refuse this
   * anyway -- but it would surface as an opaque foreign-key error. Counting
   * first turns that into a 409 that says exactly how many reports are in the
   * way.
   *
   * Cascading was rejected deliberately: reports are the historical record of
   * work done, and deleting a finished project must not erase the weeks people
   * spent on it. If a project should disappear from the UI, the right feature
   * is archiving it, not deleting the reports.
   */
  async remove(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      select: { id: true, name: true, _count: { select: { reports: true } } },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project._count.reports > 0) {
      throw new ConflictException(
        `"${project.name}" cannot be deleted: ${project._count.reports} report(s) ` +
          'are filed against it.',
      );
    }

    await this.prisma.project.delete({ where: { id } });

    return { id, deleted: true };
  }

  async addMember(projectId: string, dto: ProjectMemberDto) {
    await this.findOne(projectId);

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      await this.prisma.projectMember.create({
        data: { projectId, userId: dto.userId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_VIOLATION
      ) {
        throw new ConflictException(
          'That user is already assigned to this project',
        );
      }
      throw error;
    }

    return this.findOne(projectId);
  }

  async removeMember(projectId: string, userId: string) {
    const membership = await this.prisma.projectMember.findUnique({
      where: { userId_projectId: { userId, projectId } },
      select: { id: true },
    });

    if (!membership) {
      throw new NotFoundException('That user is not assigned to this project');
    }

    await this.prisma.projectMember.delete({ where: { id: membership.id } });

    return this.findOne(projectId);
  }
}
