import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import { AppModule } from 'src/app.module';
import { resetDatabase, testPrisma } from './test-setup';

describe('Workspaces & Tenant Isolation (e2e)', () => {
  let app: INestApplication;
  let tokenUserA: string;
  let tokenUserB: string;
  let workspaceAId: number;

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
        email: 'usera@example.com',
        password: 'Password123!',
        fullName: 'User A',
      });
    tokenUserA = regA.body.access_token;

    // Register User B
    const regB = await supertest(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'userb@example.com',
        password: 'Password123!',
        fullName: 'User B',
      });
    tokenUserB = regB.body.access_token;
  });

  afterAll(async () => {
    await app.close();
    await testPrisma.$disconnect();
  });

  it('POST /workspaces - User A creates Workspace A', async () => {
    const res = await supertest(app.getHttpServer())
      .post('/workspaces')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({ name: 'Workspace A', description: 'User A Workspace' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Workspace A');
    workspaceAId = res.body.id;
  });

  it('GET /workspaces - User A lists workspaces (contains Workspace A)', async () => {
    const res = await supertest(app.getHttpServer())
      .get('/workspaces')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((w: any) => w.id === workspaceAId)).toBe(true);
  });

  it('GET /workspaces - User B lists workspaces (does NOT contain Workspace A - Tenant Isolation)', async () => {
    const res = await supertest(app.getHttpServer())
      .get('/workspaces')
      .set('Authorization', `Bearer ${tokenUserB}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((w: any) => w.id === workspaceAId)).toBe(false);
  });

  it('GET /workspaces/:id - User B tries to access Workspace A (403 Forbidden)', async () => {
    await supertest(app.getHttpServer())
      .get(`/workspaces/${workspaceAId}`)
      .set('Authorization', `Bearer ${tokenUserB}`)
      .expect(403);
  });

  it('PATCH /workspaces/:id - User B tries to update Workspace A (403 Forbidden)', async () => {
    await supertest(app.getHttpServer())
      .patch(`/workspaces/${workspaceAId}`)
      .set('Authorization', `Bearer ${tokenUserB}`)
      .send({ name: 'Hacked Workspace' })
      .expect(403);
  });

  it('DELETE /workspaces/:id - User A (OWNER) soft deletes Workspace A', async () => {
    await supertest(app.getHttpServer())
      .delete(`/workspaces/${workspaceAId}`)
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(200);
  });
});
