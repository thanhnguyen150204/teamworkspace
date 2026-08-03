import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { WorkspaceRole } from '@prisma/client';
import { WorkspaceMembershipGuard } from 'src/auth/guards/workspace-membership.guard';
import { WorkspaceRolesGuard } from 'src/auth/guards/WorkspaceRolesGuard';

@Controller('workspaces/:workspaceId/members')
@UseGuards(JwtAuthGuard, WorkspaceMembershipGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) { }

  @Post()
  @UseGuards(WorkspaceRolesGuard)
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  invite(@Param('workspaceId') workspaceId: number, @Body('email') email: string, @Body('role') role: WorkspaceRole) {
    return this.membershipsService.invite(workspaceId, email, role);
  }

  @Get()
  getMembers(@Param('workspaceId') workspaceId: number) {
    return this.membershipsService.getMembers(workspaceId);
  }

  @Patch(':userId')
  @UseGuards(WorkspaceRolesGuard)
  @Roles(WorkspaceRole.OWNER)
  updateRole(@Param('workspaceId') workspaceId: number, @Param('userId') userId: number, @Body('role') role: WorkspaceRole) {
    return this.membershipsService.updateRole(workspaceId, userId, role);
  }

  @Delete(':userId')
  @UseGuards(WorkspaceRolesGuard)
  @Roles(WorkspaceRole.OWNER)
  removeMember(@Param('workspaceId') workspaceId: number, @Param('userId') userId: number) {
    return this.membershipsService.removeMember(workspaceId, userId);
  }
}
