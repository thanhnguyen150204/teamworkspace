import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorkspaceAccessService } from 'src/workspaces/workspace-access.service';
import { ActivityAction, EntityType } from '@prisma/client';
import { ActivityService } from 'src/activity/activity.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService,
    private readonly workspaceAccess: WorkspaceAccessService,
    private readonly activity: ActivityService,
  ) { }

  async create(workspaceId: number, createProjectDto: CreateProjectDto, currentUserId: number) {
    await this.workspaceAccess.requireMembership(currentUserId, workspaceId);
    const projectExist = await this.prisma.project.findFirst({
      where: {
        name: createProjectDto.name,
        deletedAt: null,
        workspaceId,
      },
    });
    if(projectExist){
      throw new ConflictException('Project already exists')
    }
    return this.prisma.project.create({
      data:{
        ...createProjectDto,
        workspaceId,
      },
    });
  }

  async findAll(workspaceId: number,currentUserId: number) {
    await this.workspaceAccess.requireMembership(currentUserId, workspaceId);
    return this.prisma.project.findMany({
      where:{
        workspaceId,
        deletedAt: null,
      }
    });
  }

 async findOne(workspaceId: number,id: number, currentUserId: number) {
  await this.workspaceAccess.requireProjectAccess(currentUserId,id );
  const project = await this.prisma.project.findFirst({
    where: { id, workspaceId, deletedAt: null }
  });
  if (!project) throw new NotFoundException('Project not found');
  return project;
  }

 async update( workspaceId: number ,id: number, updateProjectDto: UpdateProjectDto,currentUserId: number) {
  await this.workspaceAccess.requireProjectAccess(currentUserId,id );
    return this.prisma.project.update({
      where:{
        id,
      },
      data:{
        ...updateProjectDto,
      }
    });
  }

  async remove(workspaceId: number, id: number, currentUserId: number) {
    await this.findOne(workspaceId, id, currentUserId); 
    const removed = await this.prisma.project.update({
      where: { id }, 
      data: { deletedAt: new Date() },
    });
    await this.activity.logProjectAction(
      workspaceId,
      currentUserId,
      ActivityAction.DELETE,
      id,
      `Deleted project "${removed.name}"`,
    );
    return removed;
  }
}
