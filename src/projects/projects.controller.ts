import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('workspaces/:workspaceId/projects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles('OWNER','ADMIN')
  createProject(@Param('workspaceId') workspaceId : number, @Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(workspaceId,createProjectDto);
  }

  @Get()
  findAll(@Param('workspaceId') workspaceId : number) {
    return this.projectsService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(@Param('workspaceId') workspaceId : number, @Param('id') id: number) {
    return this.projectsService.findOne(workspaceId,id);
  }

  @Patch(':id')
  @Roles('OWNER','ADMIN') 
  update(@Param('workspaceId') workspaceId: number ,@Param('id') id: number, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(workspaceId,id, updateProjectDto);
  }

  @Delete(':id')
  @Roles('OWNER','ADMIN')
  remove(@Param('workspaceId') workspaceId: number ,@Param('id') id: number) {
    return this.projectsService.remove(workspaceId,id);
  }
}
