import { Module } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { UsersModule } from 'src/users/users.module';
import { ActivityModule } from 'src/activity/activity.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WorkspaceRolesGuard } from 'src/auth/guards/WorkspaceRolesGuard';
import { WorkspaceMembershipGuard } from 'src/auth/guards/workspace-membership.guard';

@Module({
  imports: [UsersModule, ActivityModule, PrismaModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspaceRolesGuard, WorkspaceMembershipGuard],
  exports: [WorkspacesService],
})
export class WorkspacesModule { }
