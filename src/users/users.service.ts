import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { publicUserSelect } from './dto/user-select.dto';


@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clodinary: CloudinaryService
  ){}

  findAll() {
    return this.prisma.user.findMany({
    where:{
        deletedAt:null,
    },
    select: publicUserSelect,
    orderBy:{
        createdAt:'desc'
    }
});
  }

  findOne(id: number) {
    return this.prisma.user.findFirst({
      where:{
        id,
        deletedAt: null,
      },
      select: publicUserSelect,
    });
  }
  findByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
      },
    });
  }
  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id);
    if(!user){
      throw new NotFoundException("User not found");
    }
    return this.prisma.user.update({
      where:{
        id:id,
      },
      data: updateUserDto,
      select: publicUserSelect,
    });
  }
  async updateAvatar(userId: number, file: Express.Multer.File){
    const avatarUrl = await this.clodinary.uploadFile(file, 'teamwork/avatars');
    return this.prisma.user.update({
      where:{ id: userId},
      data: {avatar: avatarUrl},
      select: publicUserSelect,
    });
  }
  async remove(id: number) {
    const user = await this.findOne(id);
    if(!user){
      throw new NotFoundException("User not found");
    }
    return this.prisma.user.update({
      where:{
          id:id,
      },
      data:{
        deletedAt:new Date(),
        isActive:false
      },
      select: publicUserSelect,
    });
  }
}
