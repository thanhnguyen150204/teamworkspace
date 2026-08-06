import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import supertest from 'supertest';
import { AppModule } from 'src/app.module';
import { resetDatabase, testPrisma } from './test-setup';

describe('Auth (e2e)', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    await app.close();
    await testPrisma.$disconnect();
  });

  const testUser = {
    email: 'auth_e2e@example.com',
    password: 'Password123!',
    fullName: 'E2E Auth User',
  };

  let refreshToken = '';

  it('/auth/register (POST) - Happy Path', async () => {
    const res = await supertest(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('refresh_token');
    expect(res.body.user).toHaveProperty('email', testUser.email);
    refreshToken = res.body.refresh_token;
  });

  it('/auth/register (POST) - Conflict on duplicate email', async () => {
    await supertest(app.getHttpServer())
      .post('/auth/register')
      .send(testUser)
      .expect(409);
  });

  it('/auth/login (POST) - Unauthorized on wrong password', async () => {
    await supertest(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: 'WrongPassword' })
      .expect(401);
  });

  it('/auth/login (POST) - Happy Path', async () => {
    const res = await supertest(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('refresh_token');
    refreshToken = res.body.refresh_token;
  });

  it('/auth/refresh (POST) - Rotate refresh token', async () => {
    const res = await supertest(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refresh_token: refreshToken })
      .expect(200);

    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('refresh_token');
    refreshToken = res.body.refresh_token;
  });

  it('/auth/logout (POST) - Logout user', async () => {
    const loginRes = await supertest(app.getHttpServer())
      .post('/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    await supertest(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${loginRes.body.access_token}`)
      .send({ refresh_token: loginRes.body.refresh_token })
      .expect(200);
  });
});
