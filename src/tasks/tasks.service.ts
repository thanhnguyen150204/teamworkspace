import { ConflictException, Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivityService } from 'src/activity/activity.service';
import { ActivityAction } from '@prisma/client';
import { WorkspaceAccessService } from 'src/workspace-access/workspace-access.service';
import { ProjectGateway } from 'src/gateway/project.gateway';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly workspaceAccess: WorkspaceAccessService,
    private readonly gateway: ProjectGateway,
  ) { }

  async createTask(
    { projectId,
      createTaskDto,
      userId }: {
        projectId: number,
        createTaskDto: CreateTaskDto,
        userId: number,
      }
  ) {
    const project = await this.workspaceAccess.requireProjectMember(
      userId,
      projectId,
    );

    const task = await this.prisma.task.findFirst({
      where: { projectId, title: createTaskDto.title, deletedAt: null },
    });
    if (task) throw new ConflictException('Task has been existed');

    const created = await this.prisma.$transaction(async (tx) => {
      const newTask = await tx.task.create({
        data: { ...createTaskDto, projectId, creatorId: userId },
      });
      await this.activity.logTaskAction(
        project.workspaceId,
        userId,
        ActivityAction.CREATE,
        newTask.id,
        `Created task "${newTask.title}"`,
        projectId,
        undefined,
        undefined,
        undefined,
        tx,
      );
      return newTask;
    });

    this.gateway.broacastToProject(projectId, 'task_created', created);
    return created;
  }

  async findAll({
    projectId,
    currentUserId,
  }: {
    projectId: number;
    currentUserId: number;
  }) {
    await this.workspaceAccess.requireProjectMember(currentUserId, projectId);
    return this.prisma.task.findMany({
      where: {
        projectId,
        deletedAt: null,
      },
    });
  }

  async getKanban({
    projectId,
    currentUserId,
  }: {
    projectId: number;
    currentUserId: number;
  }) {
    await this.workspaceAccess.requireProjectMember(currentUserId, projectId);
    const tasks = await this.prisma.task.findMany({
      where: {
        projectId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        projectId: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        creatorId: true,
      },
    });
    return {
      TODO: tasks.filter((t) => t.status === 'TODO'),
      IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS'),
      REVIEW: tasks.filter((t) => t.status === 'REVIEW'),
      DONE: tasks.filter((t) => t.status === 'DONE'),
    };
  }

  async findOne({
    taskId,
    currentUserId,
  }: {
    taskId: number;
    currentUserId: number;
  }) {
    const task = await this.workspaceAccess.requireTaskMember(
      currentUserId,
      taskId,
    );
    return task;
  }

  async update({ id, userId, updateTaskDto }: { id: number, userId: number, updateTaskDto: UpdateTaskDto }) {
    const oldTask = await this.workspaceAccess.requireTaskMember(userId, id);
    const workspaceId = oldTask.project.workspaceId;
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.task.update({
        where: { id },
        data: updateTaskDto,
      });
      if (updateTaskDto.status && updateTaskDto.status !== oldTask.status) {
        await this.activity.logTaskAction(
          workspaceId,
          userId,
          ActivityAction.UPDATE,
          id,
          `Moved task "${oldTask.title}" from ${oldTask.status} to ${updateTaskDto.status}`,
          oldTask.projectId,
          'status',
          oldTask.status,
          updateTaskDto.status,
          tx,
        );
      } else {
        await this.activity.logTaskAction(
          workspaceId,
          userId,
          ActivityAction.UPDATE,
          id,
          `Updated task "${oldTask.title}"`,
          oldTask.projectId,
          undefined,
          undefined,
          undefined,
          tx,
        );
      }
      return result;
    });

    if (updateTaskDto.status && updateTaskDto.status !== oldTask.status) {
      this.gateway.broacastToProject(oldTask.projectId, 'task_moved', {
        taskId: id,
        oldStatus: oldTask.status,
        newStatus: updateTaskDto.status,
        task: updated,
      });
    } else {
      this.gateway.broacastToProject(oldTask.projectId, 'task_updated', updated);
    }

    return updated;
  }

  async remove({ id, userId }: { id: number; userId: number }) {
    const task = await this.workspaceAccess.requireTaskMember(userId, id);
    const workspaceId = task.project.workspaceId;
    const removed = await this.prisma.$transaction(async (tx) => {
      const result = await tx.task.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await this.activity.logTaskAction(
        workspaceId,
        userId,
        ActivityAction.DELETE,
        id,
        `Deleted task "${task.title}"`,
        task.projectId,
        undefined,
        undefined,
        undefined,
        tx,
      );
      return result;
    });

    this.gateway.broacastToProject(task.projectId, 'task_deleted', { taskId: id });
    return removed;
  }
}
