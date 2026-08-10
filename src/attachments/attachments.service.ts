import { Injectable, NotFoundException } from '@nestjs/common';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorkspaceAccessService } from 'src/workspace-access/workspace-access.service';

function decodeOriginalName(originalname: string): string {
  try {
    return Buffer.from(originalname, 'latin1').toString('utf8');
  } catch {
    return originalname;
  }
}
function sanitizeFileName(name: string): string {
  const decoded = decodeOriginalName(name);
  return (
    decoded
      .replace(/\0/g, '') // delete null byte
      .replace(/[\/\\]/g, '_') // replace path / and \\
      .replace(/\.\.+/g, '.') // block path traversal (..)
      .trim() || 'unnamed_attachment'
  );
}
@Injectable()
export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) { }
  private extractPublicId(fileUrl: string): string | null {
    try {
      return fileUrl
        .split('/upload/')[1]
        .replace(/^v\d+\//, '')
        .replace(/\.[^/.]+$/, '');
    } catch {
      return null;
    }
  }
  async upload(
    { taskId,
      file,
      userId, }
      : {
        taskId: number,
        file: Express.Multer.File,
        userId: number,
      }
  ) {
    await this.workspaceAccess.requireTaskMember(userId, taskId);
    const fileUrl = await this.cloudinary.uploadFile(
      file,
      'teamwork/attachments',
    );
    const fileName = sanitizeFileName(file.originalname);
    try {
      return await this.prisma.attachment.create({
        data: {
          taskId,
          fileName,
          fileUrl,
          fileSize: file.size,
          mimeType: file.mimetype,
        },
      });
    } catch (error) {
      const publicId = this.extractPublicId(fileUrl);
      if (publicId) {
        await this.cloudinary.deleteFile(publicId).catch(() => { });
      }
      throw error;
    }
  }

  async findAll({
    taskId,
    currentUserId,
  }: {
    taskId: number;
    currentUserId: number;
  }) {
    await this.workspaceAccess.requireTaskMember(currentUserId, taskId);
    return this.prisma.attachment.findMany({
      where: {
        taskId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove({ id, taskId, currentUserId }: { id: number, taskId: number, currentUserId: number }) {
    await this.workspaceAccess.requireTaskMember(currentUserId, taskId);
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });
    if (!attachment) throw new NotFoundException('Attachment not found');
    if (attachment.taskId !== taskId) {
      throw new NotFoundException('Attachment not found in this task');
    }

    const publicId = this.extractPublicId(attachment.fileUrl);
    if (publicId) {
      await this.cloudinary.deleteFile(publicId).catch(() => { });
    }
    return this.prisma.attachment.delete({ where: { id } });
  }
}
