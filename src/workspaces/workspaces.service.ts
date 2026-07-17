import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { EntityType, Prisma } from 'generated/prisma/browser';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { ActivityService } from 'src/activity/activity.service';
import { ActivityAction } from '@prisma/client';
@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly activity: ActivityService,
  ){}

  async create(userId: number, createWorkspaceDto: CreateWorkspaceDto) {
    const workspace= await this.prisma.workspace.create({
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
    await this.activity.log({
      userId, 
      action: ActivityAction.CREATE,
      entityType: EntityType.WORKSPACE,
      entityId: workspace.id,
      description: `Created workspace ${workspace.name}`,
    });
    return workspace;
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

  async update(id: number, userId: number, updateWorkspaceDto: UpdateWorkspaceDto) {
    const workspace = await this.findOne(id);
    const updated = await this.prisma.workspace.update({
      where: {id},
      data: updateWorkspaceDto,
    });
    await this.activity.log({
      userId,
      action: ActivityAction.UPDATE,
      entityType: EntityType.WORKSPACE,
      entityId: id,
      description: `Updated workspace "${workspace.name}"`,
    });
    return updated;
  }

  async remove(id: number, userId: number) {
    const workspace = await this.findOne(id);
    const removed = await this.prisma.workspace.update({
      where: {id},
      data: {deletedAt: new Date()},
    });
    await this.activity.log({
      userId,
      action: ActivityAction.DELETE,
      entityType: EntityType.WORKSPACE,
      entityId: id,
      description: `Deleted workspace "${workspace.name}"`,
    });
    return removed;
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
