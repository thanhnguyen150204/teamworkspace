import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { Cron,CronExpression } from "@nestjs/schedule";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class TokenCleanupSchedule implements OnApplicationBootstrap{
    private readonly logger = new Logger(TokenCleanupSchedule.name);

    constructor(private readonly prisma: PrismaService) { }

    async onApplicationBootstrap() {
    await this.handleExpiredTokenCleanup();
    }

    // Purge expired or revoked refresh tokens daily at 2:00 AM.

    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async handleExpiredTokenCleanup(): Promise<void> {
        this.logger.log('Starting schelduled job: Cleaning expired refresh tokens ...');

        try {
            const result = await this.prisma.refreshToken.deleteMany({
                where: {
                    OR: [
                        { expiresAt: { lt: new Date() } },
                        { revoked: true },
                    ],
                },
            });
            this.logger.log(`Cleanup suscess: Removed ${result.count} expired/revoked token(s).`);
        } catch (error) {
            this.logger.error('Failed to clean up expired refresh tokens:', error);
        }
    }
}