import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Workspace } from "@prisma/client";
import { Observable } from "rxjs";
import { WorkspacesService } from "src/workspaces/workspaces.service";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { parse } from "path";

@Injectable()
export class RolesGuard implements CanActivate{
    constructor(
        private reflector: Reflector,
        private workspaceService: WorkspacesService,
    ){}
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requireRoles = this.reflector.getAllAndOverride<string[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );
        if(!requireRoles) return true;

        const request = context.switchToHttp().getRequest();
        const userId = request.user.id;

        const workspaceId = parseInt(request.params.id);
        if(!workspaceId) return true;
        const userRole = await this.workspaceService.getUserRole(userId, workspaceId);
        if(!userRole || !requireRoles.includes(userRole)){
            throw new ForbiddenException('You do not have permission');
        }
        return true;
    }
}