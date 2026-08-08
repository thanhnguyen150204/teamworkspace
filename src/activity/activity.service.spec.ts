import { Test, TestingModule } from '@nestjs/testing';
import { ActivityService } from './activity.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorkspaceAccessService } from 'src/workspaces/workspace-access.service';
import { ActivityAction, EntityType } from '@prisma/client';

describe('ActivityService', () => {
  let service: ActivityService;
  let prisma: jest.Mocked<PrismaService>;
  let workspaceAccess: jest.Mocked<WorkspaceAccessService>;

  beforeEach(async () => {
    const mockPrisma = {
      activity: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const mockWorkspaceAccess = {
      requireMembership: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WorkspaceAccessService, useValue: mockWorkspaceAccess },
      ],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
    prisma = module.get(PrismaService);
    workspaceAccess = module.get(WorkspaceAccessService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('logWorkspaceAction', () => {
    it('should log workspace action cleanly', async () => {
      (prisma.activity.create as jest.Mock).mockResolvedValue({ id: 1 });
      await service.logWorkspaceAction(
        1,
        2,
        ActivityAction.CREATE,
        'Created workspace',
      );
      expect(prisma.activity.create).toHaveBeenCalledWith({
        data: {
          workspaceId: 1,
          userId: 2,
          action: ActivityAction.CREATE,
          entityType: EntityType.WORKSPACE,
          entityId: 1,
          description: 'Created workspace',
        },
      });
    });
  });

  describe('getWorkspaceActivity', () => {
    it('should require membership and return workspace activities', async () => {
      workspaceAccess.requireMembership.mockResolvedValue({} as any);
      (prisma.activity.findMany as jest.Mock).mockResolvedValue([{ id: 1 }]);

      const result = await service.getWorkspaceActivity({
        workspaceId: 1,
        currentUserId: 2,
      });
      expect(workspaceAccess.requireMembership).toHaveBeenCalledWith(2, 1);
      expect(result).toEqual([{ id: 1 }]);
    });
  });
});
