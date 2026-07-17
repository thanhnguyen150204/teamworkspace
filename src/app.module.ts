import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MembershipsModule } from './memberships/memberships.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { CommentsModule } from './comments/comments.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { ActivityLogsModule } from './activity/activity-logs.module';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD} from '@nestjs/core';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { AttachmentsModule } from './attachments/attachments.module';


@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    AuthModule,
    UsersModule,
    WorkspacesModule,
    MembershipsModule,
    ProjectsModule,
    TasksModule,
    CommentsModule,
    AttachmentsModule,
    ActivityLogsModule,
    PrismaModule,
    CommonModule,  
  ],
  controllers: [AppController],
  providers: [AppService, {provide: APP_GUARD, useClass: ThrottlerGuard}],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*path'); 
  }
}
