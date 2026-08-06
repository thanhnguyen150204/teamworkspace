import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivityAction, EntityType } from '@prisma/client';
import { WorkspaceAccessService } from 'src/workspaces/workspace-access.service';

export interface LogActivityParams {
  workspaceId: number;
  userId: number;
  action: ActivityAction;
  entityType: EntityType;
  entityId: number;
  projectId?: number;
  taskId?: number;
  description?: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
}

@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  log(data: LogActivityParams) {
    return this.prisma.activity.create({ data });
  }

  logWorkspaceAction(workspaceId: number, userId: number, action: ActivityAction, description: string) {
    return this.log({
      workspaceId,
      userId,
      action,
      entityType: EntityType.WORKSPACE,
      entityId: workspaceId,
      description,
    });
  }

  logProjectAction(workspaceId: number, userId: number, action: ActivityAction, projectId: number, description: string) {
    return this.log({
      workspaceId,
      userId,
      projectId,
      action,
      entityType: EntityType.PROJECT,
      entityId: projectId,
      description,
    });
  }

  logTaskAction(
    workspaceId: number,
    userId: number,
    action: ActivityAction,
    taskId: number,
    description: string,
    projectId?: number,
    fieldName?: string,
    oldValue?: string,
    newValue?: string,
  ) {
    return this.log({
      workspaceId,
      userId,
      projectId,
      taskId,
      action,
      entityType: EntityType.TASK,
      entityId: taskId,
      description,
      fieldName,
      oldValue,
      newValue,
    });
  }

  async getWorkspaceActivity(workspaceId: number, currentUserId: number) {
    await this.workspaceAccess.requireMembership(currentUserId, workspaceId);
    return this.prisma.activity.findMany({
      where: {
        workspaceId,
      },
      include: { user: { select: { id: true, fullName: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  getUserActivity(userId: number) {
    return this.prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
