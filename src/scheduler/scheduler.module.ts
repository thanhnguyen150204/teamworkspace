import { Module } from '@nestjs/common';
import { TokenCleanupSchedule } from './services/token-cleanup.schedule';
import { TaskReminderSchedule } from './services/task-reminder.schedule';
import { TrashCleanupSchedule } from './services/trash-cleanup.schedule';

@Module({
  providers: [
    TokenCleanupSchedule,
    TaskReminderSchedule,
    TrashCleanupSchedule,
  ],
})
export class SchedulerModule {}
