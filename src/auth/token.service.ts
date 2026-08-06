import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  signAccessToken(userId: number, email: string): string {
    const secret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET!;
    return this.jwtService.sign(
      {
        sub: userId,
        email,
      },
      {
        secret,
        expiresIn: '15m',
      },
    );
  }

  signRefreshToken(
    userId: number,
    email: string,
  ): { token: string; jti: string } {
    const jti = randomUUID();
    const secret = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET!;
    const token = this.jwtService.sign(
      { sub: userId, email, jti },
      {
        secret,
        expiresIn: '7d',
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
      const secret =
        process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET!;
      return this.jwtService.verify(token, {
        secret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
