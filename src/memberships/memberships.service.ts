import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}
  async invite({workspaceId, email, role}: {workspaceId: number, email: string, role: WorkspaceRole}) {
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
    return this.prisma.membership.create({
      data: { userId: user.id, workspaceId, role },
    });
  }
  getMembers(workspaceId: number) {
    return this.prisma.membership.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, avatar: true },
        },
      },
    });
  }

  updateRole({workspaceId, userId, newRole}: {workspaceId: number, userId: number, newRole: WorkspaceRole}) {
    return this.prisma.membership.update({
      where: { userId_workspaceId: { userId, workspaceId } },
      data: { role: newRole },
    });
  }

  removeMember({
    workspaceId,
    userId,
  }: {
    workspaceId: number;
    userId: number;
  }) {
    return this.prisma.membership.delete({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
  }
}
