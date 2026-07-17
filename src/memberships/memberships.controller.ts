import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { WorkspaceRole } from '@prisma/client';

@Controller('workspaces/:workspaceId/members')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post()
  @Roles('OWNER', 'ADMIN')
  invite(@Param('workspaceId') workspaceId: number, @Body('email') email: string , @Body('role') role: WorkspaceRole) {
    return this.membershipsService.invite(workspaceId,email,role);
  }

  @Get()
  getMembers(@Param('workspaceId') workspaceId : number) {
    return this.membershipsService.getMembers(workspaceId);
  }

  @Patch(':userId')
  @Roles('OWNER')
  updateRole(@Param('workspaceId') workspaceId: number, @Param('userId') userId: number,@Body('role') role: WorkspaceRole) {
    return this.membershipsService.updateRole(workspaceId,userId, role);
  }

  @Delete(':userId')
  @Roles('OWNER')
  removeMember(@Param('workspaceId') workspaceId: number, @Param('userId') userId: number) {
    return this.membershipsService.removeMember(workspaceId, userId);
  }
}
