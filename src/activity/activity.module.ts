import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityController } from './activity.controller';
import { WorkspaceAccessModule } from 'src/workspace-access/workspace-access.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [WorkspaceAccessModule, PrismaModule],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule { }
