import { forwardRef, Module } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { WorkspacesController } from './workspaces.controller';
import { UsersModule } from 'src/users/users.module';
import { ActivityModule } from 'src/activity/activity.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WorkspaceRolesGuard } from 'src/auth/guards/WorkspaceRolesGuard';
import { WorkspaceMembershipGuard } from 'src/auth/guards/workspace-membership.guard';
import { WorkspaceAccessService } from './workspace-access.service';

@Module({
  imports: [UsersModule, forwardRef(() => ActivityModule), PrismaModule],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspaceRolesGuard, WorkspaceMembershipGuard, WorkspaceAccessService],
  exports: [WorkspacesService, WorkspaceAccessService],
})
export class WorkspacesModule { }
