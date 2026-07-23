import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';


@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clodinary: CloudinaryService
  ){}
  async create(createUserDto: CreateUserDto) {
    try {
      return await this.prisma.user.create({
        data: {
          ...createUserDto,
        },  
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  findAll() {
    return this.prisma.user.findMany({
    where:{
        deletedAt:null,
    },
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
    });
  }
  async updateAvatar(userId: number, file: Express.Multer.File){
    const avatarUrl = await this.clodinary.uploadFile(file, 'teamwork/avatars');
    return this.prisma.user.update({
      where:{ id: userId},
      data: {avatar: avatarUrl},
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
      } 
    });
  }
}
