import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorkspaceAccessService } from 'src/workspaces/workspace-access.service';
import { ActivityService } from 'src/activity/activity.service';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: any;
  let workspaceAccess: any;
  let activity: any;

  const mockProject = {
    id: 1,
    name: 'Project One',
    description: 'Description 1',
    workspaceId: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(async () => {
    const mockPrisma = {
      project: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockWorkspaceAccess = {
      requireMembership: jest.fn(),
      requireProjectAccess: jest.fn(),
    };

    const mockActivity = {
      logProjectAction: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WorkspaceAccessService, useValue: mockWorkspaceAccess },
        { provide: ActivityService, useValue: mockActivity },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = mockPrisma;
    workspaceAccess = mockWorkspaceAccess;
    activity = mockActivity;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if project name already exists in workspace', async () => {
      workspaceAccess.requireMembership.mockResolvedValue({} as any);
      (prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProject);

      await expect(
        service.create(10, { name: 'Project One' }, 1),
      ).rejects.toThrow(ConflictException);
    });

    it('should create project on happy path', async () => {
      workspaceAccess.requireMembership.mockResolvedValue({} as any);
      (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.project.create as jest.Mock).mockResolvedValue(mockProject);

      const result = await service.create(10, { name: 'Project One' }, 1);
      expect(result).toEqual(mockProject);
    });
  });

  describe('findOne', () => {
    it('should throw ForbiddenException if user has no project access', async () => {
      workspaceAccess.requireProjectAccess.mockRejectedValue(
        new ForbiddenException(),
      );
      await expect(service.findOne(10, 1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if project deleted or non-existent', async () => {
      workspaceAccess.requireProjectAccess.mockResolvedValue({} as any);
      (prisma.project.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(service.findOne(10, 999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return project on happy path', async () => {
      workspaceAccess.requireProjectAccess.mockResolvedValue({} as any);
      (prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProject);

      const result = await service.findOne(10, 1, 1);
      expect(result).toEqual(mockProject);
    });
  });

  describe('remove', () => {
    it('should soft delete project and log action', async () => {
      workspaceAccess.requireProjectAccess.mockResolvedValue({} as any);
      (prisma.project.findFirst as jest.Mock).mockResolvedValue(mockProject);
      (prisma.project.update as jest.Mock).mockResolvedValue({
        ...mockProject,
        deletedAt: new Date(),
      });

      const result = await service.remove(10, 1, 1);
      expect(result.deletedAt).toBeDefined();
      expect(activity.logProjectAction).toHaveBeenCalled();
    });
  });
});
