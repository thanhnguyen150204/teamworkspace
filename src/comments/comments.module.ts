import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { WorkspacesModule } from 'src/workspaces/workspaces.module';

@Module({
  imports: [WorkspacesModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
