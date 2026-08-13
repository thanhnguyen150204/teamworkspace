import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { Cron,CronExpression } from "@nestjs/schedule/dist";
import { TaskStatus } from "@prisma/client";
import { title } from "process";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class TaskReminderSchedule implements OnApplicationBootstrap {
    private readonly logger = new Logger(TaskReminderSchedule.name);
    constructor(private readonly prisma: PrismaService) { }
    // auto run while app start other by scan task miss time during timeoff server
    async onApplicationBootstrap() {
        await this.handleOverdueTaskCheck()
    }
    // Auto-run every day at 8 AM to check and process overdue tasks.
    @Cron(CronExpression.EVERY_DAY_AT_8AM)
    async handleOverdueTaskCheck(): Promise<void> {
        this.logger.log('Starting schelduled job: Sending task reminders ...');
        try{
            const overdueTasks = await this.prisma.task.findMany({
                where: {
                    dueDate: { lt: new Date()},
                    status: { not: TaskStatus.DONE},
                    deletedAt: null,
                },
                select: {
                    id: true,
                    title: true,
                    dueDate: true,
                    creatorId: true,
                },
            });
            if(overdueTasks.length === 0){
                this.logger.log('No overdue tasks found');
                return;
            }
            this.logger.warn(`Found ${overdueTasks.length} overdue task(s)`);
            overdueTasks.forEach((task) => {
                this.logger.debug(
                    `Task #${task.id} "${task.title}" is overdue (Due date: ${task.dueDate?.toISOString()})`,
                );                
            });
        }catch(error){
            this.logger.error('Failed to process overdue tasks check:', error);
        }
    }
}