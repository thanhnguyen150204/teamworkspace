import { Module } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { AttachmentsController } from './attachments.controller';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import { WorkspacesModule } from 'src/workspaces/workspaces.module';

@Module({
  imports: [CloudinaryModule, WorkspacesModule],
  controllers: [AttachmentsController],
  providers: [AttachmentsService],
})
export class AttachmentsModule {}
