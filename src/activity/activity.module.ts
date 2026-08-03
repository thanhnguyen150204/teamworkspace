import { forwardRef, Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { WorkspacesModule } from 'src/workspaces/workspaces.module';

@Module({
  imports: [forwardRef(() => WorkspacesModule)],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
