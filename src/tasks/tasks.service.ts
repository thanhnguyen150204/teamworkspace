import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivityService } from 'src/activity/activity.service';
import { ActivityAction, EntityType } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ){}
  async createTask(projectId: number, createTaskDto: CreateTaskDto, creatorId: number) {
    const task = await this.prisma.task.findFirst({
      where: { projectId, title: createTaskDto.title, deletedAt: null },
    });
    if (task) throw new ConflictException('Task has been existed');

    const created = await this.prisma.task.create({
      data: { ...createTaskDto, projectId, creatorId },
    });
    await this.activity.log({
      userId: creatorId,
      action: ActivityAction.CREATE,
      entityType: EntityType.TASK,
      entityId: created.id,
      description: `Created task "${created.title}"`,
    });
    return created;
  }

  findAll(projectId: number) {
    return this.prisma.task.findMany({
      where:{
        projectId,
        deletedAt: null
      },
    });
  }
  async getKanban(projectId: number){
    const tasks = await this.prisma.task.findMany({
      where:{
        projectId,
        deletedAt: null
      },
      orderBy: { createdAt: 'asc'},
      select:{
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
      TODO: tasks.filter(t=> t.status === 'TODO'),
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
      REVIEW: tasks.filter(t=> t.status === 'REVIEW'),
      DONE: tasks.filter(t => t.status ==='DONE')
    };
  }

  async findOne(projectId: number,id: number) {
    const taskExist = await this.prisma.task.findFirst({
      where:{
        projectId,
        id,
        deletedAt: null
      },
    });
    if(!taskExist){
      throw new NotFoundException('Task not found');
    }
    return taskExist;
  }

  async update(projectId: number, id: number, userId: number, updateTaskDto: UpdateTaskDto) {
    const oldTask = await this.findOne(projectId, id);
    const updated = await this.prisma.task.update({
      where: { id },
      data: updateTaskDto,
    });
    if (updateTaskDto.status && updateTaskDto.status !== oldTask.status) {
      await this.activity.log({
        userId,
        action: ActivityAction.UPDATE,
        entityType: EntityType.TASK,
        entityId: id,
        fieldName: 'status',
        oldValue: oldTask.status,
        newValue: updateTaskDto.status,
        description: `Moved task "${oldTask.title}" from ${oldTask.status} to ${updateTaskDto.status}`,
      });
    } else {
      await this.activity.log({
        userId,
        action: ActivityAction.UPDATE,
        entityType: EntityType.TASK,
        entityId: id,
        description: `Updated task "${oldTask.title}"`,
      });
    }
    return updated;
  }

  async remove(projectId: number, id: number, userId: number) {
    const task = await this.findOne(projectId, id);
    const removed = await this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    await this.activity.log({
      userId,
      action: ActivityAction.DELETE,
      entityType: EntityType.TASK,
      entityId: id,
      description: `Deleted task "${task.title}"`,
    });
    return removed;
  }
}
