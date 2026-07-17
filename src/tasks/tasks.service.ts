import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService){}
  async createTask(projectId: number,createTaskDto: CreateTaskDto, creatorId: number) {
    const task = await this.prisma.task.findFirst({
      where:{
        projectId,
        title:createTaskDto.title,
        deletedAt: null
      },
    });
    if(task){
      throw new ConflictException('Task has been existed');
    }
    return this.prisma.task.create({
      data:{
        ...createTaskDto,
        projectId,
        creatorId
      }
    })
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
        title: true,
        description: true,
        status: true,   
        dueDate: true,
        createdAt: true,
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

  async update(projectId: number,id: number, updateTaskDto: UpdateTaskDto) {
    await this.findOne(projectId, id);
    return this.prisma.task.update({
      where:{
        id,
      },
      data: updateTaskDto,
    });
  }

  async remove(projectId: number,id: number) {
    await this.findOne(projectId, id);
    return this.prisma.task.update({
      where:{
        id,
      },
      data:{
        deletedAt: new Date(),
      },
    });
  }
}
