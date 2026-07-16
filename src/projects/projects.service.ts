import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(workspaceId: number, createProjectDto: CreateProjectDto) {
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

  findAll(workspaceId: number) {
    return this.prisma.project.findMany({
      where:{
        workspaceId,
        deletedAt: null,
      }
    });
  }

 async findOne(workspaceId: number,id: number) {
  const project = await this.prisma.project.findFirst({
    where: { id, workspaceId, deletedAt: null }
  });
  if (!project) throw new NotFoundException('Project not found');
  return project;
  }

 async update( workspaceId: number ,id: number, updateProjectDto: UpdateProjectDto) {
   await this.findOne(workspaceId,id);
    return this.prisma.project.update({
      where:{
        id,
      },
      data:{
        ...updateProjectDto,
      }
    });
  }

  async remove(workspaceId: number, id: number) {
    await this.findOne(workspaceId, id); // validate project thuộc đúng workspace
    return this.prisma.project.update({
      where: { id }, // chỉ dùng @id field
      data: { deletedAt: new Date() },
    });
  }
}
