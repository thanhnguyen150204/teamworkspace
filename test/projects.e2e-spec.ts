import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import { AppModule } from 'src/app.module';
import { resetDatabase, testPrisma } from './test-setup';
import { WorkspaceRole } from '@prisma/client';

describe('Projects & Role Matrix RBAC (e2e)', () => {
  let app: INestApplication;
  let tokenOwner: string;
  let tokenMember: string;
  let workspaceId: number;
  let projectId: number;

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

    // Register Owner
    const regOwner = await supertest(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'owner@example.com',
        password: 'Password123!',
        fullName: 'Owner User',
      });
    tokenOwner = regOwner.body.access_token;

    // Register Member
    const regMember = await supertest(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'member@example.com',
        password: 'Password123!',
        fullName: 'Member User',
      });
    tokenMember = regMember.body.access_token;

    // Create Workspace
    const wsRes = await supertest(app.getHttpServer())
      .post('/workspaces')
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ name: 'RBAC Workspace' });
    workspaceId = wsRes.body.id;

    // Invite Member to Workspace
    await supertest(app.getHttpServer())
      .post(`/workspaces/${workspaceId}/members`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ email: 'member@example.com', role: WorkspaceRole.MEMBER });
  });

  afterAll(async () => {
    await app.close();
    await testPrisma.$disconnect();
  });

  it('POST /workspaces/:wId/projects - MEMBER tries to create project (403 Forbidden - RBAC)', async () => {
    await supertest(app.getHttpServer())
      .post(`/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${tokenMember}`)
      .send({ name: 'Member Project Attempt' })
      .expect(403);
  });

  it('POST /workspaces/:wId/projects - OWNER creates project (201 Created)', async () => {
    const res = await supertest(app.getHttpServer())
      .post(`/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .send({ name: 'Owner Project' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Owner Project');
    projectId = res.body.id;
  });

  it('GET /workspaces/:wId/projects - MEMBER can list workspace projects', async () => {
    const res = await supertest(app.getHttpServer())
      .get(`/workspaces/${workspaceId}/projects`)
      .set('Authorization', `Bearer ${tokenMember}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((p: any) => p.id === projectId)).toBe(true);
  });

  it('PATCH /workspaces/:wId/projects/:id - MEMBER tries to update project (403 Forbidden - RBAC)', async () => {
    await supertest(app.getHttpServer())
      .patch(`/workspaces/${workspaceId}/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenMember}`)
      .send({ name: 'Hacked Project' })
      .expect(403);
  });

  it('DELETE /workspaces/:wId/projects/:id - MEMBER tries to delete project (403 Forbidden - RBAC)', async () => {
    await supertest(app.getHttpServer())
      .delete(`/workspaces/${workspaceId}/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenMember}`)
      .expect(403);
  });

  it('DELETE /workspaces/:wId/projects/:id - OWNER deletes project (200 OK)', async () => {
    await supertest(app.getHttpServer())
      .delete(`/workspaces/${workspaceId}/projects/${projectId}`)
      .set('Authorization', `Bearer ${tokenOwner}`)
      .expect(200);
  });
});
