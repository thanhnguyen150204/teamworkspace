import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { WorkspacesModule } from 'src/workspaces/workspaces.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WorkspaceRolesGuard } from 'src/auth/guards/WorkspaceRolesGuard';
import { WorkspaceMembershipGuard } from 'src/auth/guards/workspace-membership.guard';
import { ActivityModule } from 'src/activity/activity.module';

@Module({
  imports: [WorkspacesModule, PrismaModule, ActivityModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, WorkspaceRolesGuard, WorkspaceMembershipGuard],
})
export class ProjectsModule {}
