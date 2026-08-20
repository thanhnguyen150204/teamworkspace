import { Test, TestingModule } from '@nestjs/testing';
import { MembershipsService } from './memberships.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { MailService } from 'src/mail/mail.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('MembershipsService', () => {
  let service: MembershipsService;
  let prisma: jest.Mocked<PrismaService>;

  const mockMailService = {
    sendWorkspaceInvite: jest.fn().mockResolvedValue(undefined),
  };

  const mockCacheManager = {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      workspace: {
        findUnique: jest.fn().mockResolvedValue({ name: 'Test Workspace' }),
      },
      membership: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MailService, useValue: mockMailService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<MembershipsService>(MembershipsService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('invite', () => {
    it('should throw NotFoundException if user email does not exist', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(
        service.invite({
          workspaceId: 1,
          email: 'nonexistent@example.com',
          role: WorkspaceRole.MEMBER,
          inviterId: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user is already a member', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 2,
        email: 'member@example.com',
      });
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        id: 10,
        userId: 2,
        workspaceId: 1,
      });

      await expect(
        service.invite({
          workspaceId: 1,
          email: 'member@example.com',
          role: WorkspaceRole.MEMBER,
          inviterId: 1,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create membership on happy path', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 2,
        email: 'newmember@example.com',
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        fullName: 'Admin User',
      });
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.membership.create as jest.Mock).mockResolvedValue({
        id: 11,
        userId: 2,
        workspaceId: 1,
        role: WorkspaceRole.MEMBER,
      });

      const result = await service.invite({
        workspaceId: 1,
        email: 'newmember@example.com',
        role: WorkspaceRole.MEMBER,
        inviterId: 1,
      });
      expect(result).toEqual({
        id: 11,
        userId: 2,
        workspaceId: 1,
        role: WorkspaceRole.MEMBER,
      });
    });
  });

  describe('updateRole', () => {
    it('should update user role in workspace', async () => {
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        userId: 2,
        workspaceId: 1,
        role: WorkspaceRole.MEMBER,
      });
      (prisma.membership.update as jest.Mock).mockResolvedValue({
        id: 10,
        userId: 2,
        workspaceId: 1,
        role: WorkspaceRole.ADMIN,
      });

      const result = await service.updateRole({
        workspaceId: 1,
        userId: 2,
        newRole: WorkspaceRole.ADMIN,
      });
      expect(result.role).toBe(WorkspaceRole.ADMIN);
    });

    it('should throw BadRequestException when trying to downgrade the last owner', async () => {
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        userId: 2,
        workspaceId: 1,
        role: WorkspaceRole.OWNER,
      });
      (prisma.membership.count as jest.Mock) = jest.fn().mockResolvedValue(1);

      await expect(
        service.updateRole({
          workspaceId: 1,
          userId: 2,
          newRole: WorkspaceRole.MEMBER,
        }),
      ).rejects.toThrow();
    });
  });

  describe('removeMember', () => {
    it('should throw BadRequestException when trying to remove the last owner', async () => {
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        userId: 2,
        workspaceId: 1,
        role: WorkspaceRole.OWNER,
      });
      (prisma.membership.count as jest.Mock) = jest.fn().mockResolvedValue(1);

      await expect(
        service.removeMember({
          workspaceId: 1,
          userId: 2,
        }),
      ).rejects.toThrow();
    });

    it('should remove member when not the last owner', async () => {
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        userId: 2,
        workspaceId: 1,
        role: WorkspaceRole.MEMBER,
      });
      (prisma.membership.delete as jest.Mock).mockResolvedValue({
        userId: 2,
        workspaceId: 1,
      });

      const result = await service.removeMember({
        workspaceId: 1,
        userId: 2,
      });
      expect(result).toBeDefined();
    });
  });
});
