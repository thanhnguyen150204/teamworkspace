import { ForbiddenException, Injectable } from '@nestjs/common';
import { Membership, Project, Task, Workspace } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WorkspaceAccessService {
  constructor(private readonly prisma: PrismaService) {}
  async requireMembership(
    userId: number,
    workspaceId: number,
  ): Promise<Membership> {
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        workspaceId,
        workspace: {
          deletedAt: null,
        },
      },
    });
    if (!membership) {
      throw new ForbiddenException('Workspace not found or you are not member');
    }
    return membership;
  }
  async requireProjectAccess(
    userId: number,
    projectId: number,
  ): Promise<Project & { workspace: Workspace }> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
        workspace: {
          deletedAt: null,
          memberships: {
            some: {
              userId,
            },
          },
        },
      },
      include: {
        workspace: true,
      },
    });
    if (!project) {
      throw new ForbiddenException(
        'Project not found or you do not have access',
      );
    }
    return project;
  }
  async requireTaskAccess(
    userId: number,
    taskId: number,
  ): Promise<Task & { project: Project }> {
    const task = await this.prisma.task.findFirst({
      where: {
        id: taskId,
        deletedAt: null,
        project: {
          deletedAt: null,
          workspace: {
            deletedAt: null,
            memberships: {
              some: {
                userId,
              },
            },
          },
        },
      },
      include: {
        project: true,
      },
    });
    if (!task) {
      throw new ForbiddenException('Task not found or you do not have access');
    }
    return task;
  }
}
