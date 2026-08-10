import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AttachmentFileValidator } from './validators/attachment-file.validator';

@Controller('tasks/:taskId/attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) { }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  upload(
    @Param('taskId', ParseIntPipe) taskId: number,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new AttachmentFileValidator(),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser('id') userId: number,
  ) {
    return this.attachmentsService.upload({ taskId, file, userId });
  }

  @Get()
  findAll(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.attachmentsService.findAll({ taskId, currentUserId: userId });
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') currentUserId: number,
  ) {
    return this.attachmentsService.remove({ id, taskId, currentUserId });
  }
}
