import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { ActivityAction, WorkspaceRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { ActivityService } from 'src/activity/activity.service';
import { WorkspaceAccessService } from '../workspace-access/workspace-access.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

/** Cache key helper */
const workspacesCacheKey = (userId: number) => `workspaces:user:${userId}`;

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly activity: ActivityService,
    private readonly workspaceAccess: WorkspaceAccessService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async create({
    userId,
    createWorkspaceDto,
  }: {
    userId: number;
    createWorkspaceDto: CreateWorkspaceDto;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          ...createWorkspaceDto,
          memberships: {
            create: {
              userId,
              role: WorkspaceRole.OWNER,
            },
          },
        },
      });
      await this.activity.logWorkspaceAction(
        workspace.id,
        userId,
        ActivityAction.CREATE,
        `Created workspace "${workspace.name}"`,
        tx,
      );
      // Invalidate the workspace list cache for this user
      await this.cache.del(workspacesCacheKey(userId));
      return workspace;
    });
  }

  async findAll(userId: number) {
    const cacheKey = workspacesCacheKey(userId);

    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const workspaces = await this.prisma.workspace.findMany({
      where: {
        deletedAt: null,
        memberships: {
          some: {
            userId,
          },
        },
      },
      include: {
        memberships: {
          select: {
            role: true,
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    // Cache for 60 seconds
    await this.cache.set(cacheKey, workspaces, 60000);
    return workspaces;
  }

  async findOne({
    id,
    currentUserId,
  }: {
    id: number;
    currentUserId: number;
  }) {
    await this.workspaceAccess.requireWorkspaceMember(currentUserId, id);
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        memberships: {
          select: {
            role: true,
            joinedAt: true,
            user: {
              select: { id: true, fullName: true, email: true, avatar: true },
            },
          },
        },
        projects: { where: { deletedAt: null } },
      },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  async update({
    id,
    userId,
    updateWorkspaceDto,
  }: {
    id: number;
    userId: number;
    updateWorkspaceDto: UpdateWorkspaceDto;
  }) {
    const workspace = await this.findOne({ id, currentUserId: userId });
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.workspace.update({
        where: { id },
        data: updateWorkspaceDto,
      });
      await this.activity.logWorkspaceAction(
        id,
        userId,
        ActivityAction.UPDATE,
        `Updated workspace "${workspace.name}"`,
        tx,
      );
      return updated;
    });
  }

  async remove({ id, userId }: { id: number; userId: number }) {
    const workspace = await this.findOne({ id, currentUserId: userId });
    return this.prisma.$transaction(async (tx) => {
      const removed = await tx.workspace.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      // Invalidate the workspace list cache for this user
      await this.cache.del(workspacesCacheKey(userId));
      await this.activity.logWorkspaceAction(
        id,
        userId,
        ActivityAction.DELETE,
        `Deleted workspace "${workspace.name}"`,
        tx,
      );
      return removed;
    });
  }

  async getUserRole({
    userId,
    workspaceId,
  }: {
    userId: number;
    workspaceId: number;
  }) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId },
      },
    });
    return membership?.role ?? null;
  }
}
