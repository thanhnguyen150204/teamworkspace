import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WorkspaceModule } from './workspaces/workspace.module';
import { MembershipModule } from './memberships/membership.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { CommentsModule } from './comments/comments.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { ActivityLogsModule } from './activity/activity-logs.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    WorkspaceModule,
    MembershipModule,
    ProjectsModule,
    TasksModule,
    CommentsModule,
    AttachmentsModule,
    ActivityLogsModule,
    PrismaModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
