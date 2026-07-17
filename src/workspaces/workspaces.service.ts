import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { Prisma } from 'generated/prisma/browser';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ){}

  create(userId: number, createWorkspaceDto: CreateWorkspaceDto) {
    return this.prisma.workspace.create({
      data:{
        ...createWorkspaceDto,
        memberships:{
          create:{
            userId,
            role: "OWNER"
          }
        }
      }
    });
  }

  findAll(userId: number) {
    return this.prisma.workspace.findMany({
      where:{
        deletedAt: null,
        memberships:{
          some:{
            userId,
          }
        },
      },
        include:{
          memberships:{
            select:{
              role: true,
              user:{
                select:{
                  id: true,
                  fullName: true,
                }
              }
            },
          },
          _count: {select: {
            projects: true,
          }
        },
      },
    });
  }

  async findOne(id: number) {
    const workspace = await this.prisma.workspace.findUnique({
      where: {id, deletedAt: null},
      include:{
        memberships: {
          select:{
            role: true,
            joinedAt: true,
            user: {select: {id: true, fullName: true, email: true, avatar: true}},
          },
        },
        projects: {where: {deletedAt: null}},
      },
    });
    if(!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  async update(id: number, updateWorkspaceDto: UpdateWorkspaceDto) {
    await this.findOne(id);
    return this.prisma.workspace.update({
      where: {id},
      data: updateWorkspaceDto,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.workspace.update({
      where: {id},
      data :{deletedAt: new Date()},
    });
  }
  async getUserRole(userId: number, workspaceId: number){
    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_workspaceId: {userId,workspaceId},
      },
    });
    return membership?.role ?? null;
  }
}
