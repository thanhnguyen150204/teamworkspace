import { Injectable, NotFoundException } from '@nestjs/common';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorkspaceAccessService } from 'src/workspaces/workspace-access.service';

function decodeOriginalName(originalname: string): string {
  try {
    return Buffer.from(originalname, 'latin1').toString('utf8');
  } catch {
    return originalname;
  }
}

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly workspaceAccess: WorkspaceAccessService
  ){}
  async upload(taskId: number, file: Express.Multer.File, currentUserId: number) {
    await this.workspaceAccess.requireTaskAccess(currentUserId, taskId);
    const fileUrl = await this.cloudinary.uploadFile(file, 'teamwork/attachments');
    const fileName = decodeOriginalName(file.originalname);
    return this.prisma.attachment.create({
      data:{
        taskId,
        fileName,
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
      }
    });
  }

  async findAll(taskId: number, currentUserId: number) {
    await this.workspaceAccess.requireTaskAccess(currentUserId, taskId);
    return this.prisma.attachment.findMany({
      where:{
        taskId
      },
      orderBy: { createdAt: 'desc'},
    });
  }
  async remove(id: number, taskId: number, currentUserId: number) {
    await this.workspaceAccess.requireTaskAccess(currentUserId, taskId);
    const attachment = await this.prisma.attachment.findUnique({
      where: {id},
    });
    if(!attachment) throw new NotFoundException('Attachment not found');
    
    const publicId = attachment.fileUrl.split('/upload/')[1].replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');
    await this.cloudinary.deleteFile(publicId);
    return this.prisma.attachment.delete({ where: {id}});
  }
}
