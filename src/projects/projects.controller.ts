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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { WorkspaceMembershipGuard } from 'src/auth/guards/workspace-membership.guard';
import { WorkspaceRole } from '@prisma/client';
import { WorkspaceRolesGuard } from 'src/auth/guards/WorkspaceRolesGuard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('workspaces/:workspaceId/projects')
@UseGuards(JwtAuthGuard, WorkspaceMembershipGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseGuards(WorkspaceRolesGuard)
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  createProject(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.projectsService.create(+workspaceId, createProjectDto, +userId);
  }

  @Get()
  findAll(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.projectsService.findAll(+workspaceId, +userId);
  }

  @Get(':id')
  findOne(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('id') id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.projectsService.findOne(+workspaceId, +id, +userId);
  }

  @Patch(':id')
  @UseGuards(WorkspaceRolesGuard)
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  update(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(
      +workspaceId,
      +id,
      updateProjectDto,
      +userId,
    );
  }

  @Delete(':id')
  @UseGuards(WorkspaceRolesGuard)
  @Roles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
  remove(
    @Param('workspaceId', ParseIntPipe) workspaceId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.projectsService.remove(+workspaceId, +id, +userId);
  }
}
