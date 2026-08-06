import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { ActivityAction, EntityType, Prisma, WorkspaceRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { ActivityService } from 'src/activity/activity.service';
import { WorkspaceAccessService } from './workspace-access.service';
@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly activity: ActivityService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ){}

  async create(userId: number, createWorkspaceDto: CreateWorkspaceDto) {
    const workspace= await this.prisma.workspace.create({
      data:{
        ...createWorkspaceDto,
        memberships:{
          create:{
            userId,
            role: WorkspaceRole.OWNER
          }
        }
      }
    });
    await this.activity.logWorkspaceAction(workspace.id, userId, ActivityAction.CREATE, `Created workspace "${workspace.name}"`);
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

  async findOne(id: number, currentUserId: number) {
    await this.workspaceAccess.requireMembership(currentUserId, id);
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id,
        deletedAt: null,
      },
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
    const workspace = await this.findOne(id, userId);
    const updated = await this.prisma.workspace.update({
      where: {id},
      data: updateWorkspaceDto,
    });
    await this.activity.logWorkspaceAction(id, userId, ActivityAction.UPDATE, `Updated workspace "${workspace.name}"`);
    return updated;
  }

  async remove(id: number, userId: number) {
    const workspace = await this.findOne(id,userId);
    const removed = await this.prisma.workspace.update({
      where: {id},
      data: {deletedAt: new Date()},
    });
    await this.activity.logWorkspaceAction(id, userId, ActivityAction.DELETE, `Deleted workspace "${workspace.name}"`);
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
