import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { ProjectsModule } from 'src/projects/projects.module';
import { ActivityModule } from 'src/activity/activity.module';
import { WorkspacesModule } from 'src/workspaces/workspaces.module';
import { GatewayModule } from 'src/gateway/gateway.module';

@Module({
  imports: [ProjectsModule, ActivityModule, WorkspacesModule, GatewayModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
