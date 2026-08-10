import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { TokenService } from './services/token.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: any;
  let refreshTokenService: any;
  let prismaService: any;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    password: 'hashedpassword',
    fullName: 'Test User',
    avatar: null,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const mockUsersService = {
      findRawByEmail: jest.fn(),
      findByEmail: jest.fn(),
    };
    const mockTokenService = {
      signAccessToken: jest.fn().mockReturnValue('mock_access_token'),
      signRefreshToken: jest
        .fn()
        .mockReturnValue({ token: 'mock_refresh_token', jti: 'mock_jti' }),
    };
    const mockRefreshTokenService = {
      create: jest.fn().mockResolvedValue({}),
      rotate: jest.fn(),
      revoke: jest.fn(),
    };
    const mockPrismaService = {
      user: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: RefreshTokenService, useValue: mockRefreshTokenService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = mockUsersService;
    refreshTokenService = mockRefreshTokenService;
    prismaService = mockPrismaService;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if user already exists', async () => {
      usersService.findRawByEmail.mockResolvedValue(mockUser);
      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user and return tokens on happy path', async () => {
      usersService.findRawByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      });
      expect(result).toHaveProperty('access_token', 'mock_access_token');
      expect(result).toHaveProperty('refresh_token', 'mock_refresh_token');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        avatar: mockUser.avatar,
        isActive: mockUser.isActive,
        lastLoginAt: mockUser.lastLoginAt,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        deletedAt: mockUser.deletedAt,
      });
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens and user details on happy path login', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toHaveProperty('access_token', 'mock_access_token');
      expect(result).toHaveProperty('refresh_token', 'mock_refresh_token');
    });
  });

  describe('refresh', () => {
    it('should delegate refresh token rotation to RefreshTokenService', async () => {
      refreshTokenService.rotate.mockResolvedValue({
        access_token: 'new_access',
        refresh_token: 'new_refresh',
      });
      const result = await service.refresh({ refresh_token: 'token123' });
      expect(result).toEqual({
        access_token: 'new_access',
        refresh_token: 'new_refresh',
      });
      expect(refreshTokenService.rotate).toHaveBeenCalledWith('token123');
    });
  });

  describe('logout', () => {
    it('should revoke token and return success message', async () => {
      const result = await service.logout(1, { refresh_token: 'token123' });
      expect(result).toEqual({ message: 'Logout successfully' });
      expect(refreshTokenService.revoke).toHaveBeenCalledWith(1, 'token123');
    });
  });
});
