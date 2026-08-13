import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class TrashCleanupSchedule implements OnApplicationBootstrap {
    private readonly logger = new Logger(TrashCleanupSchedule.name);
    constructor(private readonly prisma: PrismaService) { }

    async onApplicationBootstrap() {
        await this.handleSoftDeletedTasksCleanup()
    }
    /**
     * Permanently delete soft-deleted tasks older than 30 days (runs every Sunday).
     */
    @Cron(CronExpression.EVERY_WEEKEND)
    async handleSoftDeletedTasksCleanup(): Promise<void> {
        this.logger.log('Starting scheduled job: Hard deleting old soft-deleted tasks...');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        try {
            const result = await this.prisma.task.deleteMany({
                where: {
                    deletedAt: { lt: thirtyDaysAgo },
                },
            });
            this.logger.log(`Trash cleanup finished: Permanently deleted ${result.count} old task(s).`);
        } catch (error) {
            this.logger.error('Failed to perform trash cleanup:', error);
        }
    }
} 