import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('tasks/:taskId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post() 
  create(@Param('taskId') taskId: number, @CurrentUser('id') userId: number, @Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.create(taskId,userId,createCommentDto);
  }

  @Get()
  findAll(@Param('taskId') taskId: number) {
    return this.commentsService.findAll(taskId);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @CurrentUser('id') userId: number, @Body() updateCommentDto: UpdateCommentDto) {
    return this.commentsService.update(id, userId, updateCommentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number, @CurrentUser('id') userId: number) {
    return this.commentsService.remove(id, userId);
  }
}
