import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  signAccessToken(userId: number, email: string): string {
    const secret = this.configService.get<string>('auth.jwtSecret');
    const expiresIn = this.configService.get<string>('auth.jwtExpiration');
    return this.jwtService.sign(
      {
        sub: userId,
        email
      },
      {
        secret,
        expiresIn: expiresIn as any,
      },
    );
  }

  signRefreshToken(
    userId: number,
    email: string,
  ): { token: string; jti: string } {
    const jti = randomUUID();
    const secret =  this.configService.get<string>('auth.refreshTokenSecret');
    const expiresIn = this.configService.get<string>('auth.refreshTokenExpiration');
    const token = this.jwtService.sign(
      { sub: userId, email, jti },
      {
        secret,
        expiresIn: expiresIn as any,
      },
    );
    return { token, jti };
  }

  verifyRefreshToken(token: string): {
    sub: number;
    email: string;
    jti: string;
  } {
    try {
      const secret =  this.configService.get<string>('auth.refreshTokenSecret');
      return this.jwtService.verify(token, {
        secret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
