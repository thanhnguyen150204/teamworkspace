import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesService } from './workspaces.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { ActivityService } from 'src/activity/activity.service';
import { WorkspaceAccessService } from './workspace-access.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  let prisma: any;
  let activity: any;
  let workspaceAccess: any;

  const mockWorkspace = {
    id: 1,
    name: 'Workspace Alpha',
    description: 'Test Workspace',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const mockPrisma = {
      workspace: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      membership: {
        findUnique: jest.fn(),
      },
    };
    const mockUsersService = {};
    const mockActivityService = {
      logWorkspaceAction: jest.fn().mockResolvedValue({}),
    };
    const mockWorkspaceAccessService = {
      requireWorkspaceMember: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: UsersService, useValue: mockUsersService },
        { provide: ActivityService, useValue: mockActivityService },
        {
          provide: WorkspaceAccessService,
          useValue: mockWorkspaceAccessService,
        },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
    prisma = mockPrisma;
    activity = mockActivityService;
    workspaceAccess = mockWorkspaceAccessService;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create workspace with OWNER membership and log activity', async () => {
      (prisma.workspace.create as jest.Mock).mockResolvedValue(mockWorkspace);
      const result = await service.create({
        userId: 1,
        createWorkspaceDto: {
          name: 'Workspace Alpha',
          description: 'Test Workspace',
        },
      });

      expect(prisma.workspace.create).toHaveBeenCalledWith({
        data: {
          name: 'Workspace Alpha',
          description: 'Test Workspace',
          memberships: {
            create: {
              userId: 1,
              role: WorkspaceRole.OWNER,
            },
          },
        },
      });
      expect(activity.logWorkspaceAction).toHaveBeenCalled();
      expect(result).toEqual(mockWorkspace);
    });
  });

  describe('findOne', () => {
    it('should throw ForbiddenException if user is not member', async () => {
      workspaceAccess.requireWorkspaceMember.mockRejectedValue(
        new ForbiddenException('Workspace not found or you are not member'),
      );
      await expect(
        service.findOne({ id: 1, currentUserId: 2 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if workspace deleted or not found', async () => {
      workspaceAccess.requireWorkspaceMember.mockResolvedValue({} as any);
      (prisma.workspace.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(
        service.findOne({ id: 99, currentUserId: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return workspace details on happy path', async () => {
      workspaceAccess.requireWorkspaceMember.mockResolvedValue({} as any);
      (prisma.workspace.findFirst as jest.Mock).mockResolvedValue(
        mockWorkspace,
      );

      const result = await service.findOne({ id: 1, currentUserId: 1 });
      expect(result).toEqual(mockWorkspace);
    });
  });

  describe('update', () => {
    it('should update workspace details and log action', async () => {
      workspaceAccess.requireWorkspaceMember.mockResolvedValue({} as any);
      (prisma.workspace.findFirst as jest.Mock).mockResolvedValue(
        mockWorkspace,
      );
      (prisma.workspace.update as jest.Mock).mockResolvedValue({
        ...mockWorkspace,
        name: 'Updated Name',
      });

      const result = await service.update({
        id: 1,
        userId: 1,
        updateWorkspaceDto: { name: 'Updated Name' },
      });
      expect(result.name).toBe('Updated Name');
      expect(activity.logWorkspaceAction).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete workspace by setting deletedAt', async () => {
      workspaceAccess.requireWorkspaceMember.mockResolvedValue({} as any);
      (prisma.workspace.findFirst as jest.Mock).mockResolvedValue(
        mockWorkspace,
      );
      (prisma.workspace.update as jest.Mock).mockResolvedValue({
        ...mockWorkspace,
        deletedAt: new Date(),
      });

      const result = await service.remove({ id: 1, userId: 1 });
      expect(result.deletedAt).toBeDefined();
      expect(activity.logWorkspaceAction).toHaveBeenCalled();
    });
  });
});
