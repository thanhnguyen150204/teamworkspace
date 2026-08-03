import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { WorkspaceRole } from "@prisma/client";
import { Observable } from "rxjs";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class WorkspaceRolesGuard implements CanActivate {
    constructor (private readonly reflector: Reflector){}
    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        if(!requiredRoles || requiredRoles.length === 0){
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const membership = request.workspaceMembership;

        if(!membership) {
            throw new ForbiddenException('Workspace membership not resolved');
        }

        if(!requiredRoles.includes(membership.role)){
            throw new ForbiddenException(
                `This action requires one of these roles: ${requiredRoles.join(', ')}`,
            );
        }
        
        return true;
    }
}