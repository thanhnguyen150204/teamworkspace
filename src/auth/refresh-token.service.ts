import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenService } from './token.service';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  async create(userId: number, token: string, jti: string, expiresAt: Date) {
    const tokenHash = this.tokenService.hashToken(token);
    return this.prisma.refreshToken.create({
      data: {
        jti,
        tokenHash,
        userId,
        expiresAt,
      },
    });
  }

  async rotate(rawRefreshToken: string) {
    // 1. Verify token signature and extract payload
    const payload = this.tokenService.verifyRefreshToken(rawRefreshToken);
    const tokenHash = this.tokenService.hashToken(rawRefreshToken);

    // 2. Find token record in DB
    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: {
        OR: [{ jti: payload.jti }, { tokenHash }],
      },
    });

    // 3. Token Reuse Detection & Validation
    if (!tokenRecord) {
      await this.revokeAllForUser(payload.sub);
      throw new UnauthorizedException(
        'Security Alert: Invalid token. All sessions revoked.',
      );
    }

    if (tokenRecord.revoked) {
      // Token Reuse Detected: An already revoked token is being used!
      await this.revokeAllForUser(payload.sub);
      throw new UnauthorizedException(
        'Security Alert: Token reuse detected! All sessions revoked.',
      );
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    // 4. Verify user status
    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, isActive: true },
    });

    if (!user) {
      await this.revokeAllForUser(payload.sub);
      throw new UnauthorizedException(
        'User account is inactive or has been deleted',
      );
    }

    // 5. Generate new token pair
    const newRefresh = this.tokenService.signRefreshToken(
      payload.sub,
      payload.email,
    );
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    // 6. Revoke current token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: {
        revoked: true,
        replaceByToken: newRefresh.jti,
      },
    });

    // 7. Save new refresh token
    await this.create(
      payload.sub,
      newRefresh.token,
      newRefresh.jti,
      newExpiresAt,
    );

    // 8. Sign new access token
    const newAccessToken = this.tokenService.signAccessToken(
      payload.sub,
      payload.email,
    );

    return {
      access_token: newAccessToken,
      refresh_token: newRefresh.token,
    };
  }

  async revoke(userId: number, rawRefreshToken: string) {
    const tokenHash = this.tokenService.hashToken(rawRefreshToken);
    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: { tokenHash, userId },
    });

    if (tokenRecord && !tokenRecord.revoked) {
      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revoked: true },
      });
    }
  }

  // Alias for backward compatibility
  async revoked(userId: number, rawRefreshToken: string) {
    return this.revoke(userId, rawRefreshToken);
  }

  async revokeAllForUser(userId: number) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  async cleanupExpiredTokens() {
    await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            revoked: true,
            createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        ],
      },
    });
  }
}
