import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { WorkspaceAccessService } from 'src/workspace-access/workspace-access.service';

@Injectable()
export class WorkspaceMembershipGuard implements CanActivate {
  constructor(private readonly workspaceAccess: WorkspaceAccessService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId: number = request.user?.id;

    // Check both workspaceId (from sub-routes like /workspaces/:workspaceId/members)
    // and id (from top-level workspace routes like /workspaces/:id)
    const rawWorkspaceId = request.params.workspaceId || request.params.id;
    const workspaceId = parseInt(rawWorkspaceId);

    if (!workspaceId || isNaN(workspaceId)) {
      throw new BadRequestException('Workspace ID is required');
    }
    if (!userId) {
      throw new ForbiddenException('Not authenticated');
    }

    const membership = await this.workspaceAccess.requireWorkspaceMember(userId, workspaceId);
    request.workspaceMembership = membership;
    return true;
  }
}
