import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService){}
  create(taskId: number, userId: number, createCommentDto: CreateCommentDto) {
    return this.prisma.comment.create({
      data:{
        ...createCommentDto,
        userId,
        taskId
      }
    })
  }

  findAll(taskId: number) {
    return this.prisma.comment.findMany({
      where:{
        taskId,
      },
      include:{
        user:{ select:{
          id: true,
          fullName: true,
          avatar: true,
        }}
      },
      orderBy:{createdAt: 'asc'}
    });
  }

  async findOne(id: number) {
    const comment= await this.prisma.comment.findUnique({
      where:{
        id,
      },
    });
    if(!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  async update(id: number, currentUserId: number , updateCommentDto: UpdateCommentDto) {
    const comment = await this.findOne(id);
    if(comment.userId !== currentUserId){
      throw new ForbiddenException('You can only edit your own comments!')
    }
    return this.prisma.comment.update({
      where:{
        id
      },
      data: updateCommentDto,
    });
  }

  async remove(id: number, currentUserId: number) {
   const comment = await this.findOne(id);
    if(comment.userId !== currentUserId){
      throw new ForbiddenException('You can only delete your own comments!')
    }
    return this.prisma.comment.delete({
      where:{
        id
      }
    });
  }
}
