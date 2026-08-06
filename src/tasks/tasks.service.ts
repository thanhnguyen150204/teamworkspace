import { ConflictException, Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivityService } from 'src/activity/activity.service';
import { ActivityAction } from '@prisma/client';
import { WorkspaceAccessService } from 'src/workspaces/workspace-access.service';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}
  async createTask(
    projectId: number,
    createTaskDto: CreateTaskDto,
    creatorId: number,
  ) {
    const project = await this.workspaceAccess.requireProjectAccess(
      creatorId,
      projectId,
    );
    const task = await this.prisma.task.findFirst({
      where: { projectId, title: createTaskDto.title, deletedAt: null },
    });
    if (task) throw new ConflictException('Task has been existed');

    const created = await this.prisma.task.create({
      data: { ...createTaskDto, projectId, creatorId },
    });
    await this.activity.logTaskAction(
      project.workspaceId,
      creatorId,
      ActivityAction.CREATE,
      created.id,
      `Created task "${created.title}"`,
      projectId,
    );
    return created;
  }

  async findAll(projectId: number, currentUserId: number) {
    await this.workspaceAccess.requireProjectAccess(currentUserId, projectId);
    return this.prisma.task.findMany({
      where: {
        projectId,
        deletedAt: null,
      },
    });
  }
  async getKanban(projectId: number, currentUserId: number) {
    await this.workspaceAccess.requireProjectAccess(currentUserId, projectId);
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

  async findOne(taskId: number, currentUserId: number) {
    const task = await this.workspaceAccess.requireTaskAccess(
      currentUserId,
      taskId,
    );
    return task;
  }

  async update(id: number, userId: number, updateTaskDto: UpdateTaskDto) {
    const oldTask = await this.workspaceAccess.requireTaskAccess(userId, id);
    const workspaceId = oldTask.project.workspaceId;
    const updated = await this.prisma.task.update({
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
      );
    } else {
      await this.activity.logTaskAction(
        workspaceId,
        userId,
        ActivityAction.UPDATE,
        id,
        `Updated task "${oldTask.title}"`,
        oldTask.projectId,
      );
    }
    return updated;
  }

  async remove(id: number, userId: number) {
    const task = await this.workspaceAccess.requireTaskAccess(userId, id);
    const workspaceId = task.project.workspaceId;
    const removed = await this.prisma.task.update({
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
    );
    return removed;
  }
}
