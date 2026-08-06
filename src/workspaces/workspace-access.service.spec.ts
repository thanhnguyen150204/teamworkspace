import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceAccessService } from './workspace-access.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';

describe('WorkspaceAccessService', () => {
  let service: WorkspaceAccessService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      membership: {
        findFirst: jest.fn(),
      },
      project: {
        findFirst: jest.fn(),
      },
      task: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceAccessService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WorkspaceAccessService>(WorkspaceAccessService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requireMembership', () => {
    it('should throw ForbiddenException if user is not member of workspace', async () => {
      (prisma.membership.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(service.requireMembership(1, 10)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return membership if user is member', async () => {
      const mockMembership = {
        id: 1,
        userId: 1,
        workspaceId: 10,
        role: WorkspaceRole.MEMBER,
      };
      (prisma.membership.findFirst as jest.Mock).mockResolvedValue(
        mockMembership,
      );

      const result = await service.requireMembership(1, 10);
      expect(result).toEqual(mockMembership);
    });
  });

  describe('requireProjectAccess', () => {
    it('should throw ForbiddenException if project not found or no access', async () => {
      (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(service.requireProjectAccess(1, 5)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return project with workspace on valid access', async () => {
      const mockProject = {
        id: 5,
        name: 'Project 1',
        workspaceId: 10,
        workspace: { id: 10 },
      };
      (prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProject);

      const result = await service.requireProjectAccess(1, 5);
      expect(result).toEqual(mockProject);
    });
  });

  describe('requireTaskAccess', () => {
    it('should throw ForbiddenException if task not found or no access', async () => {
      (prisma.task.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(service.requireTaskAccess(1, 99)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return task with project on valid access', async () => {
      const mockTask = {
        id: 99,
        title: 'Task 1',
        project: { id: 5, workspaceId: 10 },
      };
      (prisma.task.findFirst as jest.Mock).mockResolvedValue(mockTask);

      const result = await service.requireTaskAccess(1, 99);
      expect(result).toEqual(mockTask);
    });
  });
});
