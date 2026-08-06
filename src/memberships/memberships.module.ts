import { Module } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { MembershipsController } from './memberships.controller';
import { WorkspacesModule } from 'src/workspaces/workspaces.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WorkspaceMembershipGuard } from 'src/auth/guards/workspace-membership.guard';
import { WorkspaceRolesGuard } from 'src/auth/guards/WorkspaceRolesGuard';

@Module({
  imports: [WorkspacesModule, PrismaModule],
  controllers: [MembershipsController],
  providers: [
    MembershipsService,
    WorkspaceMembershipGuard,
    WorkspaceRolesGuard,
  ],
})
export class MembershipsModule {}
