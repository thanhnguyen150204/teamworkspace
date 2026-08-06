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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(
    @Param('projectId') projectId: number,
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.tasksService.createTask(+projectId, createTaskDto, +userId);
  }

  @Get()
  findAll(
    @Param('projectId') projectId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.tasksService.findAll(+projectId, +userId);
  }
  @Get('kanban')
  getKanban(
    @Param('projectId') projectId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.tasksService.getKanban(+projectId, +userId);
  }
  @Get(':id')
  findOne(@Param('id') id: number, @CurrentUser('id') userId: number) {
    return this.tasksService.findOne(+id, +userId);
  }

  @Patch(':id')
  update(
    @Param('projectId') projectId: number,
    @Param('id') id: number,
    @CurrentUser('id') userId: number,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.tasksService.update(+id, +userId, updateTaskDto);
  }

  @Delete(':id')
  remove(
    @Param('projectId') projectId: number,
    @Param('id') id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.tasksService.remove(+id, +userId);
  }
}
