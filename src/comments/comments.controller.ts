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
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('tasks/:taskId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') userId: number,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(taskId, userId, createCommentDto);
  }

  @Get()
  findAll(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.commentsService.findAll(taskId, userId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.commentsService.findOne(id, taskId, userId);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') userId: number,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, taskId, userId, updateCommentDto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.commentsService.remove(id, taskId, userId);
  }
}
