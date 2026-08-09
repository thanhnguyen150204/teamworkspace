import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivityService } from 'src/activity/activity.service';
import { WorkspaceAccessService } from 'src/workspaces/workspace-access.service';
import { ConflictException } from '@nestjs/common';
import { TaskStatus, TaskPriority } from '@prisma/client';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: any;
  let activity: any;
  let workspaceAccess: any;

  const mockTask = {
    id: 1,
    title: 'Design UI',
    description: 'Create Figma design',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    dueDate: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    creatorId: 1,
    projectId: 10,
    project: {
      id: 10,
      workspaceId: 5,
    },
  };

  beforeEach(async () => {
    const mockPrisma = {
      task: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockActivity = {
      logTaskAction: jest.fn().mockResolvedValue({}),
    };

    const mockWorkspaceAccess = {
      requireProjectMember: jest.fn(),
      requireTaskMember: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ActivityService, useValue: mockActivity },
        { provide: WorkspaceAccessService, useValue: mockWorkspaceAccess },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    prisma = mockPrisma;
    activity = mockActivity;
    workspaceAccess = mockWorkspaceAccess;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTask', () => {
    it('should throw ConflictException if task with same title exists in project', async () => {
      workspaceAccess.requireProjectMember.mockResolvedValue({
        workspaceId: 5,
      } as any);
      (prisma.task.findFirst as jest.Mock).mockResolvedValue(mockTask);

      await expect(
        service.createTask({
          projectId: 10,
          createTaskDto: { title: 'Design UI' },
          userId: 1,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create task and log activity on happy path', async () => {
      workspaceAccess.requireProjectMember.mockResolvedValue({
        workspaceId: 5,
      } as any);
      (prisma.task.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.task.create as jest.Mock).mockResolvedValue(mockTask);

      const result = await service.createTask({
        projectId: 10,
        createTaskDto: { title: 'Design UI' },
        userId: 1,
      });
      expect(result).toEqual(mockTask);
      expect(activity.logTaskAction).toHaveBeenCalled();
    });
  });

  describe('getKanban', () => {
    it('should categorize tasks into TODO, IN_PROGRESS, REVIEW, DONE', async () => {
      workspaceAccess.requireProjectMember.mockResolvedValue({
        workspaceId: 5,
      } as any);
      const tasks = [
        { ...mockTask, id: 1, status: TaskStatus.TODO },
        { ...mockTask, id: 2, status: TaskStatus.IN_PROGRESS },
        { ...mockTask, id: 3, status: TaskStatus.DONE },
      ];
      (prisma.task.findMany as jest.Mock).mockResolvedValue(tasks);

      const result = await service.getKanban({ projectId: 10, currentUserId: 1 });
      expect(result.TODO.length).toBe(1);
      expect(result.IN_PROGRESS.length).toBe(1);
      expect(result.REVIEW.length).toBe(0);
      expect(result.DONE.length).toBe(1);
    });
  });

  describe('update', () => {
    it('should log status transition when task status is updated', async () => {
      workspaceAccess.requireTaskMember.mockResolvedValue(mockTask as any);
      (prisma.task.update as jest.Mock).mockResolvedValue({
        ...mockTask,
        status: TaskStatus.IN_PROGRESS,
      });

      const result = await service.update({
        id: 1,
        userId: 1,
        updateTaskDto: {
          status: TaskStatus.IN_PROGRESS,
        },
      });
      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
      expect(activity.logTaskAction).toHaveBeenCalledWith(
        5,
        1,
        'UPDATE',
        1,
        expect.stringContaining('Moved task'),
        10,
        'status',
        TaskStatus.TODO,
        TaskStatus.IN_PROGRESS,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete task and log action', async () => {
      workspaceAccess.requireTaskMember.mockResolvedValue(mockTask as any);
      (prisma.task.update as jest.Mock).mockResolvedValue({
        ...mockTask,
        deletedAt: new Date(),
      });

      const result = await service.remove({ id: 1, userId: 1 });
      expect(result.deletedAt).toBeDefined();
      expect(activity.logTaskAction).toHaveBeenCalled();
    });
  });
});
