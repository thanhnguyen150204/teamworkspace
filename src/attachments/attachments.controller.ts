import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('tasks/:taskId/attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file',{
    storage: memoryStorage(),
    limits: {fileSize: 5 * 1024 *1024},
  }))
  upload(@Param('taskId') taskId: number, @UploadedFile() file: Express.Multer.File, @CurrentUser('id') userId: number) {
    return this.attachmentsService.upload(taskId,file, userId);
  }

  @Get()
  findAll(@Param('taskId') taskId: number, @CurrentUser('id') userId: number) {
    return this.attachmentsService.findAll(taskId, userId);
  }
  @Delete(':id')
  remove(@Param('id') id: number, @Param('taskId') taskId: number, @CurrentUser('id') userId: number) {
    return this.attachmentsService.remove(id, taskId, userId);
  }
}
