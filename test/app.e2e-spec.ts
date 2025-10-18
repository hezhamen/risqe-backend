import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let groupId: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('Auth: register and login', async () => {
    // Attempt to register; ignore if already exists (409)
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'e2e@example.com', password: 'secret123' });

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'e2e@example.com', password: 'secret123' })
      .expect(201);
    token = res.body.access_token;
    expect(token).toBeDefined();
  });

  it('ROSCA: create group, list groups, members', async () => {
    const create = await request(app.getHttpServer())
      .post('/rosca/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'E2E Group', totalFundTarget: 500 })
      .expect(201);
    groupId = create.body.id;

    await request(app.getHttpServer())
      .get('/rosca/groups')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/rosca/groups/${groupId}/members`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('Financials: create and list withdrawals', async () => {
    await request(app.getHttpServer())
      .post('/financials/withdrawals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 0,
        paymentMethod: 'BANK_TRANSFER',
        paymentDetails: JSON.stringify({ iban: 'DE...' }),
      })
      .expect(201);

    await request(app.getHttpServer())
      .get('/financials/withdrawals')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('Community: posts and comments', async () => {
    const post = await request(app.getHttpServer())
      .post('/community/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'E2E Post', content: 'Content' })
      .expect(201);
    const postId = post.body.id;

    await request(app.getHttpServer())
      .post(`/community/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Nice!' })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/community/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
});
