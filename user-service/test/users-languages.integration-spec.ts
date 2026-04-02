import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DatabaseService } from 'src/database/database.service';
import { createTestApplication } from './helpers/test-app';
import { buildCreateUserPayload, createUserRecord, xUserHeader } from './helpers/fixtures';
import {
  resetDatabase,
  seedLanguages,
  startTestDatabase,
  stopTestDatabase,
  TEST_LANGUAGE_IDS,
  TestDatabaseContext,
} from './helpers/test-db';

describe('user-service integration (users + languages)', () => {
  let app: INestApplication;
  let prisma: DatabaseService;
  let db: TestDatabaseContext;

  beforeAll(async () => {
    db = await startTestDatabase();
    const context = await createTestApplication();
    app = context.app;
    prisma = context.prisma;
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    await seedLanguages(prisma);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (prisma) {
      await prisma.$disconnect();
    }
    if (db) {
      await stopTestDatabase(db);
    }
  });

  describe('app smoke', () => {
    it('responds on GET /', async () => {
      await request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });

    it('responds on GET /health', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        service: 'user-service',
      });
    });
  });

  describe('users endpoints', () => {
    it('creates a user, overrides auth0Id from x-user and persists nested relations', async () => {
      const auth0Id = 'auth0|user-create';
      const payload = buildCreateUserPayload({
        auth0Id: 'auth0|spoofed',
        links: [{ linkString: 'https://github.com/example-user' }],
        education: [
          {
            schoolName: 'University of Gdansk',
            major: 'Computer Science',
            degree: 'BSc',
            beginDate: '2020-10-01',
            endDate: '2023-06-30',
          },
        ],
        certificates: [
          {
            name: 'AWS Certified Developer',
            issuer: 'Amazon',
            certificationDate: '2024-01-10',
          },
        ],
        abilities: [{ name: 'TypeScript' }],
        workExperience: [
          {
            companyName: 'Acme Corp',
            position: 'Backend Engineer',
            beginDate: '2023-07-01',
            endDate: '2024-12-01',
            description: 'Built APIs and maintained distributed services.',
          },
        ],
        languages: [{ languageId: TEST_LANGUAGE_IDS.english, level: 'B2' }],
      });

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('x-user', xUserHeader(auth0Id))
        .send(payload)
        .expect(201);

      expect(response.body).toMatchObject({
        statusCode: 201,
        message: 'User successfully created',
        data: {
          name: payload.name,
          surname: payload.surname,
          email: payload.email,
        },
      });

      const persisted = await prisma.user.findUnique({
        where: { auth0_id: auth0Id },
        include: {
          links: true,
          education: true,
          certificates: true,
          abilities: true,
          work_experiences: true,
          user_languages: {
            include: { language: true },
          },
        },
      });

      expect(persisted).not.toBeNull();
      expect(persisted?.auth0_id).toBe(auth0Id);
      expect(persisted?.links).toHaveLength(1);
      expect(persisted?.education).toHaveLength(1);
      expect(persisted?.certificates).toHaveLength(1);
      expect(persisted?.abilities).toHaveLength(1);
      expect(persisted?.work_experiences).toHaveLength(1);
      expect(persisted?.user_languages).toHaveLength(1);
      expect(persisted?.user_languages[0].language.code).toBe('en');
    });

    it('rejects POST /users without x-user header', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(buildCreateUserPayload())
        .expect(400);

      expect(response.body.message).toBe('User id not provided in x-user header');
    });

    it('rejects invalid user payloads through ValidationPipe', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .set('x-user', xUserHeader('auth0|invalid'))
        .send({
          ...buildCreateUserPayload(),
          email: 'invalid-email',
          extraField: 'forbidden',
        })
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          'property extraField should not exist',
          'email must be an email',
        ]),
      );
    });

    it('rejects duplicate users with the service-level duplicate guard', async () => {
      const existing = await createUserRecord(prisma, {
        auth0_id: 'auth0|existing',
        email: 'existing@example.com',
        phone_number: '+48500111222',
      });

      const response = await request(app.getHttpServer())
        .post('/users')
        .set('x-user', xUserHeader(existing.auth0_id))
        .send(
          buildCreateUserPayload({
            email: existing.email,
            phoneNumber: existing.phone_number,
          }),
        )
        .expect(400);

      expect(response.body.message).toBe('Cannot create user');
    });

    it('returns profile existence for current and public user lookups', async () => {
      const user = await createUserRecord(prisma, {
        auth0_id: 'auth0|profile-check',
      });

      await request(app.getHttpServer())
        .get('/users/profile-exists')
        .set('x-user', xUserHeader(user.auth0_id))
        .expect(200)
        .expect({
          statusCode: 200,
          message: 'User exists',
          data: { exists: true },
        });

      await request(app.getHttpServer())
        .get(`/users/${user.auth0_id}/profile-exists`)
        .expect(200)
        .expect({
          statusCode: 200,
          message: 'User exists',
          data: { exists: true },
        });

      await request(app.getHttpServer())
        .get('/users/profile-exists')
        .expect(400);
    });

    it('returns current user with selective relations only when requested', async () => {
      const user = await prisma.user.create({
        data: {
          auth0_id: 'auth0|query-user',
          name: 'Query',
          surname: 'User',
          phone_number: '+48500666777',
          email: 'query@example.com',
          city: 'Krakow',
          profile_summary: 'Summary long enough for update and validation checks.',
          links: {
            create: [{ linkString: 'https://example.com/profile' }],
          },
          user_languages: {
            create: [
              {
                language_id: TEST_LANGUAGE_IDS.polish,
                level: 'Native',
              },
            ],
          },
        },
      });

      const basicResponse = await request(app.getHttpServer())
        .get('/users/me')
        .set('x-user', xUserHeader(user.auth0_id))
        .expect(200);

      expect(basicResponse.body.data).toMatchObject({
        auth0_id: user.auth0_id,
        email: user.email,
      });
      expect(basicResponse.body.data.links).toBeUndefined();
      expect(basicResponse.body.data.user_languages).toBeUndefined();

      const languagesOnlyResponse = await request(app.getHttpServer())
        .get('/users/me?languages=true')
        .set('x-user', xUserHeader(user.auth0_id))
        .expect(200);

      expect(languagesOnlyResponse.body.data.user_languages).toHaveLength(1);
      expect(languagesOnlyResponse.body.data.links).toBeUndefined();

      const allResponse = await request(app.getHttpServer())
        .get(`/users/${user.auth0_id}?all=true`)
        .expect(200);

      expect(allResponse.body.data.links).toHaveLength(1);
      expect(allResponse.body.data.user_languages).toHaveLength(1);
    });

    it('updates current user profile and maps Prisma unique conflicts to 409', async () => {
      const user = await createUserRecord(prisma, {
        auth0_id: 'auth0|update-me',
        phone_number: '+48500999111',
      });
      await createUserRecord(prisma, {
        auth0_id: 'auth0|other-user',
        phone_number: '+48500999222',
        email: 'other@example.com',
      });

      const successResponse = await request(app.getHttpServer())
        .patch('/users/me')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({
          city: 'Sopot',
          profileSummary: 'Updated profile summary with enough useful detail.',
        })
        .expect(200);

      expect(successResponse.body.data.city).toBe('Sopot');
      expect(successResponse.body.data.profile_summary).toBe(
        'Updated profile summary with enough useful detail.',
      );

      await request(app.getHttpServer())
        .patch('/users/me')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({})
        .expect(400);

      const conflictResponse = await request(app.getHttpServer())
        .patch('/users/me')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({ phoneNumber: '+48500999222' })
        .expect(409);

      expect(conflictResponse.body.statusCode).toBe(409);
    });

    it('deletes users and cascades related records', async () => {
      const user = await prisma.user.create({
        data: {
          auth0_id: 'auth0|delete-me',
          name: 'Delete',
          surname: 'Me',
          phone_number: '+48500444555',
          email: 'delete@example.com',
          city: 'Poznan',
          profile_summary: 'Profile summary long enough to satisfy all validators.',
          links: {
            create: [{ linkString: 'https://example.com/delete-me' }],
          },
          education: {
            create: [
              {
                school_name: 'Technical University',
                major: 'Informatics',
                degree: 'MSc',
                begin_date: new Date('2018-10-01'),
                end_date: new Date('2020-06-30'),
              },
            ],
          },
          work_experiences: {
            create: [
              {
                company_name: 'Delete Corp',
                position: 'Engineer',
                begin_date: new Date('2020-07-01'),
                end_date: new Date('2022-01-01'),
                description: 'Handled integrations and platform operations.',
              },
            ],
          },
          user_languages: {
            create: [
              {
                language_id: TEST_LANGUAGE_IDS.german,
                level: 'B1',
              },
            ],
          },
          certificates: {
            create: [
              {
                name: 'Kubernetes Administrator',
                issuer: 'CNCF',
                certification_date: new Date('2023-03-01'),
              },
            ],
          },
          abilities: {
            create: [{ name: 'Docker' }],
          },
        },
      });

      const response = await request(app.getHttpServer())
        .delete(`/users/${user.auth0_id}`)
        .expect(200);

      expect(response.body.message).toBe('User successfully deleted');

      expect(
        await prisma.link.count({ where: { user_id: user.id } }),
      ).toBe(0);
      expect(
        await prisma.education.count({ where: { user_id: user.id } }),
      ).toBe(0);
      expect(
        await prisma.work_Experience.count({ where: { user_id: user.id } }),
      ).toBe(0);
      expect(
        await prisma.user_Languages.count({ where: { user_id: user.id } }),
      ).toBe(0);
      expect(
        await prisma.certificate.count({ where: { user_id: user.id } }),
      ).toBe(0);
      expect(
        await prisma.abilities.count({ where: { user_id: user.id } }),
      ).toBe(0);
    });

    it('maps deleting a missing user to Prisma 404 response', async () => {
      const response = await request(app.getHttpServer())
        .delete('/users/auth0|missing-user')
        .expect(404);

      expect(response.body.statusCode).toBe(404);
    });
  });

  describe('languages endpoints', () => {
    it('lists all available languages in alphabetical order', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/languages/all')
        .expect(200);

      expect(response.body.data.map((item: { name: string }) => item.name)).toEqual([
        'English',
        'French',
        'German',
        'Polish',
        'Spanish',
      ]);
    });

    it('lists languages for current and public user', async () => {
      const user = await prisma.user.create({
        data: {
          auth0_id: 'auth0|langs-user',
          name: 'Lang',
          surname: 'User',
          phone_number: '+48500333111',
          email: 'lang-user@example.com',
          city: 'Gdynia',
          profile_summary: 'Profile summary long enough for language endpoint tests.',
          user_languages: {
            create: [
              {
                language_id: TEST_LANGUAGE_IDS.polish,
                level: 'Native',
              },
              {
                language_id: TEST_LANGUAGE_IDS.english,
                level: 'C1',
              },
            ],
          },
        },
      });

      const mine = await request(app.getHttpServer())
        .get('/users/languages')
        .set('x-user', xUserHeader(user.auth0_id))
        .expect(200);

      expect(mine.body.data).toHaveLength(2);
      expect(mine.body.data[0].language).toBeDefined();

      const publicResponse = await request(app.getHttpServer())
        .get(`/users/${user.auth0_id}/languages`)
        .expect(200);

      expect(publicResponse.body.data).toHaveLength(2);
    });

    it('rejects current-user language access without x-user header', async () => {
      await request(app.getHttpServer()).get('/users/languages').expect(400);
    });

    it('bulk-merges user languages with create, update and delete semantics', async () => {
      const user = await prisma.user.create({
        data: {
          auth0_id: 'auth0|langs-merge',
          name: 'Merge',
          surname: 'User',
          phone_number: '+48500333222',
          email: 'merge@example.com',
          city: 'Lodz',
          profile_summary: 'Profile summary long enough for merge language tests.',
          user_languages: {
            create: [
              {
                language_id: TEST_LANGUAGE_IDS.english,
                level: 'B1',
              },
              {
                language_id: TEST_LANGUAGE_IDS.polish,
                level: 'Native',
              },
            ],
          },
        },
      });

      const existing = await prisma.user_Languages.findMany({
        where: { user_id: user.id },
        orderBy: { id: 'asc' },
      });

      const response = await request(app.getHttpServer())
        .put('/users/languages')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({
          languages: [
            {
              id: existing[0].id,
              languageId: TEST_LANGUAGE_IDS.english,
              level: 'C1',
            },
            {
              languageId: TEST_LANGUAGE_IDS.german,
              level: 'B2',
            },
          ],
        })
        .expect(200);

      expect(response.body.metadata).toEqual({
        created: 1,
        updated: 1,
        deleted: 1,
      });

      const persisted = await prisma.user_Languages.findMany({
        where: { user_id: user.id },
        include: { language: true },
        orderBy: { id: 'asc' },
      });

      expect(persisted).toHaveLength(2);
      expect(
        persisted.map((item) => ({
          code: item.language.code,
          level: item.level,
        })),
      ).toEqual(
        expect.arrayContaining([
          { code: 'en', level: 'C1' },
          { code: 'de', level: 'B2' },
        ]),
      );
    });

    it('rejects duplicate language ids in payload', async () => {
      const user = await createUserRecord(prisma, {
        auth0_id: 'auth0|langs-duplicate',
      });

      const response = await request(app.getHttpServer())
        .put('/users/languages')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({
          languages: [
            { languageId: TEST_LANGUAGE_IDS.english, level: 'B2' },
            { languageId: TEST_LANGUAGE_IDS.english, level: 'C1' },
          ],
        })
        .expect(400);

      expect(response.body.message).toBe(
        `Language ${TEST_LANGUAGE_IDS.english} is provided more than once in payload`,
      );
    });

    it('rejects missing referenced languages', async () => {
      const user = await createUserRecord(prisma, {
        auth0_id: 'auth0|langs-missing-ref',
      });

      const response = await request(app.getHttpServer())
        .put('/users/languages')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({
          languages: [{ languageId: 9999, level: 'A1' }],
        })
        .expect(404);

      expect(response.body.message).toBe('Language with id 9999 not found');
    });

    it('rejects updates for a missing current user', async () => {
      const response = await request(app.getHttpServer())
        .put('/users/languages')
        .set('x-user', xUserHeader('auth0|ghost-user'))
        .send({
          languages: [{ languageId: TEST_LANGUAGE_IDS.english, level: 'A2' }],
        })
        .expect(404);

      expect(response.body.message).toBe('User not found');
    });
  });
});
