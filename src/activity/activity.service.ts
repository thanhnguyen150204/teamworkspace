import { Injectable } from '@nestjs/common';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {    ActivityAction, EntityType, WorkspaceRole } from '@prisma/client';
import { WorkspaceAccessService } from 'src/workspaces/workspace-access.service';

@Injectable()
export class ActivityService {
  constructor (private readonly prisma: PrismaService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ){}
  log(data:{
    userId: number;
    action: ActivityAction;
    entityType: EntityType;
    entityId: number;
    description?: string;
    fieldName?: string;
    oldValue?: string;
    newValue?: string;
  }){
    return this.prisma.activity.create({ data });
  }
  async getWorkspaceActivity(workspaceId: number, currentUserId: number){
    await this.workspaceAccess.requireMembership(currentUserId, workspaceId);
    return this.prisma.activity.findMany({
      where: {
        user:{
          memberships: { some: {workspaceId}}
              }
            },
      include: {user: { select: { id: true, fullName: true}}},
      orderBy: {createdAt: 'desc'},
      take: 50,    
    });
  }
  getUserActivity(userId: number){  
    return this.prisma.activity.findMany({
      where:{ userId},
      orderBy: {createdAt: 'desc'},
      take: 50,
    });
  }
}
