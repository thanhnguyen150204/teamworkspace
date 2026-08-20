import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

/** Cache key helper */
const membersCacheKey = (workspaceId: number) =>
  `members:workspace:${workspaceId}`;

@Injectable()
export class MembershipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async invite({
    workspaceId,
    email,
    role,
    inviterId,
  }: {
    workspaceId: number;
    email: string;
    role: WorkspaceRole;
    inviterId: number;
  }) {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.prisma.membership.findUnique({
      where: {
        userId_workspaceId: { userId: user.id, workspaceId },
      },
    });
    if (existing) {
      throw new ConflictException('User is already a member');
    }

    // Fetch workspace name and inviter info in parallel for the invite email
    const [workspace, inviter] = await Promise.all([
      this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true },
      }),
      this.prisma.user.findUnique({
        where: { id: inviterId },
        select: { fullName: true },
      }),
    ]);

    const membership = await this.prisma.membership.create({
      data: { userId: user.id, workspaceId, role },
    });

    // Invalidate the members cache for this workspace
    await this.cache.del(membersCacheKey(workspaceId));

    // Send invite email asynchronously — does not block the response
    if (workspace && inviter) {
      void this.mailService.sendWorkspaceInvite({
        to: email,
        inviterName: inviter.fullName,
        workspaceName: workspace.name,
        workspaceId,
        role,
      });
    }

    return membership;
  }

  async getMembers(workspaceId: number) {
    const cacheKey = membersCacheKey(workspaceId);

    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const members = await this.prisma.membership.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, avatar: true },
        },
      },
    });

    // Cache for 60 seconds
    await this.cache.set(cacheKey, members, 60000);
    return members;
  }

  async updateRole({
    workspaceId,
    userId,
    newRole,
  }: {
    workspaceId: number;
    userId: number;
    newRole: WorkspaceRole;
  }) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership) throw new NotFoundException('Member not found');

    if (
      membership.role === WorkspaceRole.OWNER &&
      newRole !== WorkspaceRole.OWNER
    ) {
      const ownerCount = await this.prisma.membership.count({
        where: { workspaceId, role: WorkspaceRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Cannot downgrade the last owner of the workspace',
        );
      }
    }

    const updated = await this.prisma.membership.update({
      where: { userId_workspaceId: { userId, workspaceId } },
      data: { role: newRole },
    });

    // Invalidate cache
    await this.cache.del(membersCacheKey(workspaceId));
    return updated;
  }

  async removeMember({
    workspaceId,
    userId,
  }: {
    workspaceId: number;
    userId: number;
  }) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!membership) throw new NotFoundException('Member not found');

    if (membership.role === WorkspaceRole.OWNER) {
      const ownerCount = await this.prisma.membership.count({
        where: { workspaceId, role: WorkspaceRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException(
          'Cannot remove the last owner of the workspace',
        );
      }
    }

    const removed = await this.prisma.membership.delete({
      where: { userId_workspaceId: { userId, workspaceId } },
    });

    // Invalidate cache
    await this.cache.del(membersCacheKey(workspaceId));
    return removed;
  }

  async leaveWorkspace({
    workspaceId,
    userId,
  }: {
    workspaceId: number;
    userId: number;
  }) {
    return this.removeMember({ workspaceId, userId });
  }
}
