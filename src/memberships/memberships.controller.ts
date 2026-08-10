import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { WorkspaceRole } from '@prisma/client';
import { WorkspaceMembershipGuard } from 'src/auth/guards/workspace-membership.guard';
import { WorkspaceRolesGuard } from 'src/auth/guards/WorkspaceRolesGuard';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('workspaces/:workspaceId/members')
@UseGuards(JwtAuthGuard, WorkspaceMembershipGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) { }

  @Post('leave')
  leaveWorkspace(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.membershipsService.leaveWorkspace({ workspaceId, userId });
  }

  @Post()
  @UseGuards(WorkspaceRolesGuard)
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  invite(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Body() dto: InviteMemberDto,
  ) {
    return this.membershipsService.invite({ workspaceId, email: dto.email, role: dto.role });
  }

  @Get()
  getMembers(@Param('workspaceId', ParseIntPipe) workspaceId: number) {
    return this.membershipsService.getMembers(workspaceId);
  }

  @Patch(':userId')
  @UseGuards(WorkspaceRolesGuard)
  @Roles(WorkspaceRole.OWNER)
  updateRole(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.membershipsService.updateRole({ workspaceId, userId, newRole: dto.role });
  }

  @Delete(':userId')
  @UseGuards(WorkspaceRolesGuard)
  @Roles(WorkspaceRole.OWNER)
  removeMember(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.membershipsService.removeMember({ workspaceId, userId });
  }
}
