import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorkspaceAccessService } from 'src/workspace-access/workspace-access.service';
import { ProjectGateway } from 'src/gateway/project.gateway';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAccess: WorkspaceAccessService,
    private readonly gateway: ProjectGateway,
  ) { }

  async create(
    { taskId,
      userId,
      createCommentDto, }
      : {
        taskId: number,
        userId: number,
        createCommentDto: CreateCommentDto,
      }) {
    await this.workspaceAccess.requireTaskMember(userId, taskId);
    const comment = await this.prisma.comment.create({
      data: {
        ...createCommentDto,
        userId,
        taskId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (task) {
      this.gateway.broacastToProject(task.projectId, 'comment_added', comment);
    }

    return comment;
  }

  async findAll({
    taskId,
    currentUserId,
  }: {
    taskId: number;
    currentUserId: number;
  }) {
    await this.workspaceAccess.requireTaskMember(currentUserId, taskId);
    return this.prisma.comment.findMany({
      where: {
        taskId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne({ id, taskId, currentUserId }: { id: number, taskId: number, currentUserId: number }) {
    await this.workspaceAccess.requireTaskMember(currentUserId, taskId);
    const comment = await this.prisma.comment.findFirst({
      where: {
        id,
        taskId,
        deletedAt: null,
      },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  async update(
    { id, taskId, currentUserId, updateCommentDto }: { id: number, taskId: number, currentUserId: number, updateCommentDto: UpdateCommentDto },
  ) {
    const comment = await this.findOne({ id, taskId, currentUserId });
    if (comment.userId !== currentUserId) {
      throw new ForbiddenException('You can only edit your own comments!');
    }
    return this.prisma.comment.update({
      where: {
        id,
      },
      data: updateCommentDto,
    });
  }

  async remove({ id, taskId, currentUserId }: { id: number, taskId: number, currentUserId: number }) {
    const comment = await this.findOne({ id, taskId, currentUserId });
    if (comment.userId !== currentUserId) {
      throw new ForbiddenException('You can only delete your own comments!');
    }
    return this.prisma.comment.update({
      where: {
        id,
      },
      data: { deletedAt: new Date() }
    });
  }
}
