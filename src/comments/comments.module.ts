import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { WorkspacesModule } from 'src/workspaces/workspaces.module';
import { GatewayModule } from 'src/gateway/gateway.module';

@Module({
  imports: [WorkspacesModule, GatewayModule],
  controllers: [CommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
