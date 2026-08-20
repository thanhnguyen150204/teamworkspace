import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  /**
   * Sends an invite email when a user is added to a workspace.
   * Fire-and-forget: errors are only logged, never thrown.
   */
  async sendWorkspaceInvite({
    to,
    inviterName,
    workspaceName,
    workspaceId,
    role,
  }: {
    to: string;
    inviterName: string;
    workspaceName: string;
    workspaceId: number;
    role: string;
  }): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const workspaceUrl = `${frontendUrl}/dashboard/workspace/${workspaceId}`;

    try {
      await this.mailerService.sendMail({
        to,
        subject: `You have been invited to workspace "${workspaceName}" on TeamWork`,
        template: 'workspace-invite',
        context: {
          inviterName,
          workspaceName,
          role,
          workspaceUrl,
        },
      });
      this.logger.log(
        `[Mail] Invite email sent → ${to} | workspace=${workspaceId}`,
      );
    } catch (error) {
      // Email errors must not propagate to avoid rolling back the main business transaction
      this.logger.error(
        `[Mail] Failed to send invite email → ${to}:`,
        error,
      );
    }
  }
}
