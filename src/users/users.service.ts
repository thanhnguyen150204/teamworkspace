import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { publicUserSelect } from './dto/user-select.dto';
import { ChangePasswordDto, UpdatePasswordDto } from './dto/change-password';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clodinary: CloudinaryService,
  ) {}

  findAll() {
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      select: publicUserSelect,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: number) {
    return this.prisma.user.findFirst({
      where: {
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
        deletedAt: null,
        isActive: true,
      },
    });
  }
  findRawByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
      },
    });
  }

  async updateProfile(userId: number, updateUserDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: updateUserDto,
      select: publicUserSelect,
    });
  }

  async update(userId: number, updateUserDto: UpdateProfileDto) {
    return this.updateProfile(userId, updateUserDto);
  }

  async updateAvatar(userId: number, file: Express.Multer.File) {
    const avatarUrl = await this.clodinary.uploadFile(file, 'teamwork/avatars');
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: publicUserSelect,
    });
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const currentPwd = changePasswordDto.currentPassword;
    const isPasswordValid = await bcrypt.compare(currentPwd, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid current password');

    const newPasswordHash = await bcrypt.hash(
      changePasswordDto.newPassword,
      10,
    );

    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: newPasswordHash,
      },
      select: publicUserSelect,
    });
  }

  async updatePassword(userId: number, changePasswordDto: UpdatePasswordDto) {
    return this.changePassword(userId, changePasswordDto);
  }

  async remove(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
      select: publicUserSelect,
    });
  }
}
