import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

@Controller('tasks/:taskId/attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file',{
    storage: memoryStorage(),
    limits: {fileSize: 5 * 1024 *1024},
  }))
  upload(@Param('taskId') taskId: number, @UploadedFile() file: Express.Multer.File) {
    return this.attachmentsService.upload(taskId,file);
  }

  @Get()
  findAll(@Param('taskId') taskId: number) {
    return this.attachmentsService.findAll(taskId);
  }
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.attachmentsService.remove(id);
  }
}
