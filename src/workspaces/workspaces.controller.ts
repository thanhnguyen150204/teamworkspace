import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { WorkspaceRolesGuard } from 'src/auth/guards/WorkspaceRolesGuard';
import { WorkspaceMembershipGuard } from 'src/auth/guards/workspace-membership.guard';
import { WorkspaceRole } from '@prisma/client';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  create(
    @CurrentUser('id') id: string,
    @Body() createWorkspaceDto: CreateWorkspaceDto,
  ) {
    return this.workspacesService.create(+id, createWorkspaceDto);
  }

  @Get()
  findAll(@CurrentUser('id') id: string) {
    return this.workspacesService.findAll(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: number) {
    return this.workspacesService.findOne(+id, userId);
  }

  @Patch(':id')
  @UseGuards(WorkspaceMembershipGuard, WorkspaceRolesGuard)
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: number,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(+id, userId, updateWorkspaceDto);
  }

  @Delete(':id')
  @UseGuards(WorkspaceMembershipGuard, WorkspaceRolesGuard)
  @Roles(WorkspaceRole.OWNER)
  remove(@Param('id') id: string, @CurrentUser('id') userId: number) {
    return this.workspacesService.remove(+id, userId);
  }
}
