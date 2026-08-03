import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Observable } from "rxjs";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class WorkspaceMembershipGuard implements CanActivate {
    constructor(private readonly prisma: PrismaService){}
    
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId: number = request.user?.id;

        const rawId = request.params.workspaceId ?? request.params.id;
        const workspaceId = parseInt(rawId);

        if(!workspaceId || isNaN(workspaceId)){
            throw new BadRequestException('Workspace ID is required');
        }
        if(!userId) {
            throw new ForbiddenException('Not authenticated');
        } 

        const membership = await this.prisma.membership.findUnique({
            where: {
                userId_workspaceId: { userId, workspaceId},
            },
        });
        if (!membership){
            throw new ForbiddenException('You are not a member of this workspace');
        }
        request.workspaceMembership = membership;
        return true;
    }
}