import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenService } from './refresh-token.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenService } from './token.service';
import { UnauthorizedException } from '@nestjs/common';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let prisma: jest.Mocked<PrismaService>;
  let tokenService: jest.Mocked<TokenService>;

  beforeEach(async () => {
    const mockPrisma = {
      refreshToken: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
    };

    const mockTokenService = {
      hashToken: jest.fn((token: string) => `hashed_${token}`),
      signAccessToken: jest.fn().mockReturnValue('new_access_token'),
      signRefreshToken: jest
        .fn()
        .mockReturnValue({ token: 'new_refresh_token', jti: 'new_jti' }),
      verifyRefreshToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TokenService, useValue: mockTokenService },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
    prisma = module.get(PrismaService);
    tokenService = module.get(TokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create refresh token entry', async () => {
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({ id: 1 });
      const result = await service.create(1, 'token123', 'jti123', new Date());
      expect(prisma.refreshToken.create).toHaveBeenCalled();
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('rotate', () => {
    it('should throw UnauthorizedException if token record not found in DB', async () => {
      tokenService.verifyRefreshToken.mockReturnValue({
        sub: 1,
        email: 'test@example.com',
        jti: 'jti123',
      });
      (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.rotate('invalid_token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 1, revoked: false },
        data: { revoked: true },
      });
    });

    it('should throw UnauthorizedException if token is already revoked (reuse detection)', async () => {
      tokenService.verifyRefreshToken.mockReturnValue({
        sub: 1,
        email: 'test@example.com',
        jti: 'jti123',
      });
      (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        revoked: true,
        expiresAt: new Date(Date.now() + 100000),
      });

      await expect(service.rotate('revoked_token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should rotate token successfully on valid refresh token', async () => {
      tokenService.verifyRefreshToken.mockReturnValue({
        sub: 1,
        email: 'test@example.com',
        jti: 'jti123',
      });
      (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        revoked: false,
        expiresAt: new Date(Date.now() + 100000),
      });
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        isActive: true,
      });
      (prisma.refreshToken.update as jest.Mock).mockResolvedValue({});
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await service.rotate('valid_token');
      expect(result).toEqual({
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
      });
    });
  });
});
