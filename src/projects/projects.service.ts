import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorkspaceAccessService } from 'src/workspace-access/workspace-access.service';
import { ActivityAction } from '@prisma/client';
import { ActivityService } from 'src/activity/activity.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccess: WorkspaceAccessService,
    private readonly activity: ActivityService,
  ) { }

  async create(
    {
      workspaceId,
      createProjectDto,
      currentUserId,
    }: {
      workspaceId: number,
      createProjectDto: CreateProjectDto,
      currentUserId: number,
    }
  ) {
    await this.workspaceAccess.requireWorkspaceMember(currentUserId, workspaceId);
    const projectExist = await this.prisma.project.findFirst({
      where: {
        name: createProjectDto.name,
        deletedAt: null,
        workspaceId,
      },
    });
    if (projectExist) {
      throw new ConflictException('Project already exists');
    }
    return this.prisma.project.create({
      data: {
        ...createProjectDto,
        workspaceId,
      },
    });
  }

  async findAll({
    workspaceId,
    currentUserId,
  }: {
    workspaceId: number;
    currentUserId: number;
  }) {
    await this.workspaceAccess.requireWorkspaceMember(currentUserId, workspaceId);
    return this.prisma.project.findMany({
      where: {
        workspaceId,
        deletedAt: null,
      },
    });
  }

  async findOne({ workspaceId, id, currentUserId }: { workspaceId: number, id: number, currentUserId: number }) {
    await this.workspaceAccess.requireProjectMember(currentUserId, id);
    const project = await this.prisma.project.findFirst({
      where: { id, workspaceId, deletedAt: null },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(
    { id, currentUserId, updateProjectDto }: { id: number, currentUserId: number, updateProjectDto: UpdateProjectDto, },
  ) {
    await this.workspaceAccess.requireProjectMember(currentUserId, id);
    return this.prisma.project.update({
      where: {
        id,
      },
      data: {
        ...updateProjectDto,
      },
    });
  }

  async remove({ workspaceId, id, currentUserId }: { workspaceId: number, id: number, currentUserId: number }) {
    await this.findOne({ workspaceId, id, currentUserId });
    return this.prisma.$transaction(async (tx) => {
      const removed = await tx.project.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await this.activity.logProjectAction(
        workspaceId,
        currentUserId,
        ActivityAction.DELETE,
        id,
        `Deleted project "${removed.name}"`,
        tx,
      );
      return removed;
    });
  }
}
