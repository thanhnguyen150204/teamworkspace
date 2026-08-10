import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RefreshTokenDto } from './dto/refresh_token.dto';
import { TokenService } from './services/token.service';
import { RefreshTokenService } from './services/refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly prisma: PrismaService,
  ) { }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.findRawByEmail(registerDto.email);
    if (user) {
      throw new ConflictException('User already exists');
    }
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const createdUser = await this.prisma.user.create({
      data: {
        fullName: registerDto.fullName,
        email: registerDto.email,
        password: hashedPassword,
      },
    });
    const { password, ...result } = createdUser;
    const tokens = await this.generateTokens(createdUser.id, createdUser.email);
    return {
      ...tokens,
      user: result,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException(
        'Invalid credentials or account deactivated',
      );
    }
    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const { password, ...result } = user;
    const tokens = await this.generateTokens(user.id, user.email);
    return {
      ...tokens,
      user: result,
    };
  }

  async generateTokens(userId: number, email: string) {
    const access_token = this.tokenService.signAccessToken(userId, email);
    const { token: refresh_token, jti } = this.tokenService.signRefreshToken(
      userId,
      email,
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenService.create(
      userId,
      refresh_token,
      jti,
      expiresAt,
    );

    return { access_token, refresh_token };
  }

  async refresh(refreshTokenDto: RefreshTokenDto) {
    return this.refreshTokenService.rotate(refreshTokenDto.refresh_token);
  }

  async logout(userId: number, refreshTokenDto: RefreshTokenDto) {
    await this.refreshTokenService.revoke(
      userId,
      refreshTokenDto.refresh_token,
    );
    return { message: 'Logout successfully' };
  }
}
