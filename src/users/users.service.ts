import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
  ){}
  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        ...createUserDto,
      },  
    });
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
    return this.prisma.user.findUnique({
      where:{
        id,
        deletedAt: null,
      },
    });
  }
  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
        deletedAt: null,
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
