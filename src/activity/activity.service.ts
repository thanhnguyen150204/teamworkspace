import { Injectable } from '@nestjs/common';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {    ActivityAction, EntityType } from '@prisma/client';

@Injectable()
export class ActivityService {
  constructor (private readonly prisma: PrismaService){}
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
  getWorkspaceActivity(workspaceId: number){
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
