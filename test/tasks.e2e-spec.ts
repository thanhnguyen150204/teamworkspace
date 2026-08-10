import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import { AppModule } from 'src/app.module';
import { resetDatabase, testPrisma } from './test-setup';
import { TaskStatus, TaskPriority } from '@prisma/client';

describe('Tasks & Ownership (e2e)', () => {
  let app: INestApplication;
  let tokenUserA: string;
  let tokenUserB: string;
  let workspaceId: number;
  let projectId: number;
  let taskId: number;

  beforeAll(async () => {
    await resetDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    // Register User A
    const regA = await supertest(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'task_usera@example.com',
        password: 'Password123!',
        fullName: 'Task User A',
      });
    tokenUserA = regA.body.access_token;

    // Register User B
    const regB = await supertest(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'task_userb@example.com',
        password: 'Password123!',
        fullName: 'Task User B',
      });
    tokenUserB = regB.body.access_token;
  });

  afterAll(async () => {
    await app.close();
    await testPrisma.$disconnect();
  });

  it('Setup Workspace & Project', async () => {
    const wsRes = await supertest(app.getHttpServer())
      .post('/workspaces')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ name: 'Task Workspace' })
      .expect(201);
    workspaceId = wsRes.body.id;

    const projRes = await supertest(app.getHttpServer())
      .post(`/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ name: 'Task Project' })
      .expect(201);
    projectId = projRes.body.id;
  });

  it('POST /projects/:projectId/tasks - Create task', async () => {
    const res = await supertest(app.getHttpServer())
      .post(`/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        title: 'E2E Task 1',
        description: 'E2E Task Description',
        priority: TaskPriority.HIGH,
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('E2E Task 1');
    taskId = res.body.id;
  });

  it('GET /projects/:projectId/tasks/kanban - Fetch Kanban board', async () => {
    const res = await supertest(app.getHttpServer())
      .get(`/projects/${projectId}/tasks/kanban`)
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(200);

    expect(res.body).toHaveProperty('TODO');
    expect(res.body).toHaveProperty('IN_PROGRESS');
    expect(res.body).toHaveProperty('REVIEW');
    expect(res.body).toHaveProperty('DONE');
    expect(res.body.TODO.some((t: any) => t.id === taskId)).toBe(true);
  });

  it('PATCH /projects/:projectId/tasks/:id - Update task status', async () => {
    const res = await supertest(app.getHttpServer())
      .patch(`/projects/${projectId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ status: TaskStatus.IN_PROGRESS })
      .expect(200);

    expect(res.body.status).toBe(TaskStatus.IN_PROGRESS);
  });

  it('GET /projects/:projectId/tasks - User B tries to access User A tasks (403 Forbidden)', async () => {
    await supertest(app.getHttpServer())
      .get(`/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${tokenUserB}`)
      .expect(403);
  });

  it('DELETE /projects/:projectId/tasks/:id - Soft delete task', async () => {
    await supertest(app.getHttpServer())
      .delete(`/projects/${projectId}/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(200);
  });
});
