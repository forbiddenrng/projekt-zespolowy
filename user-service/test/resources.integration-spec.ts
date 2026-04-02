import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DatabaseService } from 'src/database/database.service';
import { createTestApplication } from './helpers/test-app';
import { createUserRecord, xUserHeader } from './helpers/fixtures';
import {
  resetDatabase,
  seedLanguages,
  startTestDatabase,
  stopTestDatabase,
  TestDatabaseContext,
} from './helpers/test-db';

describe('user-service integration (resource endpoints)', () => {
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

  describe('work experiences', () => {
    it('lists current and public work experiences ordered by begin_date desc', async () => {
      const user = await prisma.user.create({
        data: {
          auth0_id: 'auth0|work-list',
          name: 'Work',
          surname: 'List',
          phone_number: '+48500777001',
          email: 'work-list@example.com',
          city: 'Gdansk',
          profile_summary: 'Profile summary long enough for work experience listing.',
          work_experiences: {
            create: [
              {
                company_name: 'Older Company',
                position: 'Junior Engineer',
                begin_date: new Date('2021-01-01'),
                end_date: new Date('2022-01-01'),
                description: 'Worked on maintaining existing backend systems.',
              },
              {
                company_name: 'Newer Company',
                position: 'Senior Engineer',
                begin_date: new Date('2023-01-01'),
                end_date: new Date('2024-01-01'),
                description: 'Led API design and infrastructure improvements.',
              },
            ],
          },
        },
      });

      const mine = await request(app.getHttpServer())
        .get('/users/work-experiences')
        .set('x-user', xUserHeader(user.auth0_id))
        .expect(200);

      expect(mine.body.data.map((item: { company_name: string }) => item.company_name)).toEqual([
        'Newer Company',
        'Older Company',
      ]);

      const publicResponse = await request(app.getHttpServer())
        .get(`/users/${user.auth0_id}/work-experiences`)
        .expect(200);

      expect(publicResponse.body.data).toHaveLength(2);
    });

    it('requires x-user for current-user work experience listing', async () => {
      await request(app.getHttpServer()).get('/users/work-experiences').expect(400);
    });

    it('bulk-merges work experiences with create, update and delete', async () => {
      const user = await prisma.user.create({
        data: {
          auth0_id: 'auth0|work-merge',
          name: 'Work',
          surname: 'Merge',
          phone_number: '+48500777002',
          email: 'work-merge@example.com',
          city: 'Warsaw',
          profile_summary: 'Profile summary long enough for work experience merge tests.',
          work_experiences: {
            create: [
              {
                company_name: 'Legacy Corp',
                position: 'Developer',
                begin_date: new Date('2020-01-01'),
                end_date: new Date('2021-01-01'),
                description: 'Built and maintained internal backend features.',
              },
              {
                company_name: 'Remove Me Inc',
                position: 'Consultant',
                begin_date: new Date('2019-01-01'),
                end_date: new Date('2019-12-01'),
                description: 'Temporary assignment on legacy systems migration.',
              },
            ],
          },
        },
      });

      const existing = await prisma.work_Experience.findMany({
        where: { user_id: user.id },
        orderBy: { id: 'asc' },
      });

      const response = await request(app.getHttpServer())
        .put('/users/work-experiences')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({
          workExperiences: [
            {
              id: existing[0].id,
              companyName: 'Legacy Corp Updated',
              position: 'Lead Developer',
              beginDate: '2020-01-01',
              endDate: '2022-01-01',
              description: 'Updated backend leadership responsibilities and architecture.',
            },
            {
              companyName: 'Fresh Startup',
              position: 'Platform Engineer',
              beginDate: '2024-01-01',
              endDate: '2025-01-01',
              description: 'Built modern APIs and deployment automation from scratch.',
            },
          ],
        })
        .expect(200);

      expect(response.body.metadata).toEqual({
        created: 1,
        updated: 1,
        deleted: 1,
      });

      const persisted = await prisma.work_Experience.findMany({
        where: { user_id: user.id },
        orderBy: { id: 'asc' },
      });

      expect(persisted).toHaveLength(2);
      expect(persisted.some((item) => item.company_name === 'Legacy Corp Updated')).toBe(true);
      expect(persisted.some((item) => item.company_name === 'Fresh Startup')).toBe(true);
    });

    it('deletes all work experiences when payload is empty', async () => {
      const user = await prisma.user.create({
        data: {
          auth0_id: 'auth0|work-delete-all',
          name: 'Work',
          surname: 'Delete',
          phone_number: '+48500777003',
          email: 'work-delete@example.com',
          city: 'Lodz',
          profile_summary: 'Profile summary long enough for bulk delete behaviour.',
          work_experiences: {
            create: [
              {
                company_name: 'Delete One',
                position: 'Engineer',
                begin_date: new Date('2020-01-01'),
                end_date: new Date('2021-01-01'),
                description: 'Valid work experience description for deletion test.',
              },
            ],
          },
        },
      });

      const response = await request(app.getHttpServer())
        .put('/users/work-experiences')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({ workExperiences: [] })
        .expect(200);

      expect(response.body.metadata.deleted).toBe(1);
      expect(
        await prisma.work_Experience.count({ where: { user_id: user.id } }),
      ).toBe(0);
    });

    it('rejects work experience merge for an id owned by another user', async () => {
      const owner = await createUserRecord(prisma, {
        auth0_id: 'auth0|work-owner',
        phone_number: '+48600777004',
        email: 'work-owner@example.com',
      });
      const otherUser = await createUserRecord(prisma, {
        auth0_id: 'auth0|work-other',
        phone_number: '+48600777005',
        email: 'work-other@example.com',
      });

      const foreignRecord = await prisma.work_Experience.create({
        data: {
          user_id: otherUser.id,
          company_name: 'Other Company',
          position: 'Engineer',
          begin_date: new Date('2021-01-01'),
          end_date: new Date('2022-01-01'),
          description: 'Foreign record used to verify ownership checks.',
        },
      });

      const response = await request(app.getHttpServer())
        .put('/users/work-experiences')
        .set('x-user', xUserHeader(owner.auth0_id))
        .send({
          workExperiences: [
            {
              id: foreignRecord.id,
              companyName: 'Attempted Hijack',
              position: 'Staff Engineer',
              beginDate: '2021-01-01',
              endDate: '2022-01-01',
              description: 'Trying to update another user record should fail.',
            },
          ],
        })
        .expect(404);

      expect(response.body.message).toContain('not found for this user');
    });

    it('rejects invalid work experience payloads', async () => {
      const user = await createUserRecord(prisma, {
        auth0_id: 'auth0|work-invalid',
        phone_number: '+48600777006',
        email: 'work-invalid@example.com',
      });

      const response = await request(app.getHttpServer())
        .put('/users/work-experiences')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({
          workExperiences: [
            {
              companyName: 'AB',
              position: 'No',
              beginDate: '2030-01-01',
              description: 'short',
            },
          ],
        })
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          'workExperiences.0.companyName must be longer than or equal to 3 characters',
          'workExperiences.0.position must be longer than or equal to 3 characters',
          'workExperiences.0.maximal allowed date for beginDate is now',
          'workExperiences.0.description must be longer than or equal to 10 characters',
        ]),
      );
    });
  });

  describe('education', () => {
    it('lists current and public education ordered by begin_date desc', async () => {
      const user = await prisma.user.create({
        data: {
          auth0_id: 'auth0|education-list',
          name: 'Edu',
          surname: 'List',
          phone_number: '+48500777011',
          email: 'education-list@example.com',
          city: 'Gdansk',
          profile_summary: 'Profile summary long enough for education listing tests.',
          education: {
            create: [
              {
                school_name: 'Older University',
                major: 'Physics',
                degree: 'BSc',
                begin_date: new Date('2017-10-01'),
                end_date: new Date('2020-06-30'),
              },
              {
                school_name: 'Newer University',
                major: 'Computer Science',
                degree: 'MSc',
                begin_date: new Date('2021-10-01'),
                end_date: new Date('2023-06-30'),
              },
            ],
          },
        },
      });

      const mine = await request(app.getHttpServer())
        .get('/users/education')
        .set('x-user', xUserHeader(user.auth0_id))
        .expect(200);

      expect(mine.body.data.map((item: { school_name: string }) => item.school_name)).toEqual([
        'Newer University',
        'Older University',
      ]);

      await request(app.getHttpServer())
        .get(`/users/${user.auth0_id}/education`)
        .expect(200);
    });

    it('bulk-merges education records and allows full deletion via empty payload', async () => {
      const user = await prisma.user.create({
        data: {
          auth0_id: 'auth0|education-merge',
          name: 'Edu',
          surname: 'Merge',
          phone_number: '+48500777012',
          email: 'education-merge@example.com',
          city: 'Poznan',
          profile_summary: 'Profile summary long enough for education merge tests.',
          education: {
            create: [
              {
                school_name: 'Legacy School',
                major: 'Math',
                degree: 'BSc',
                begin_date: new Date('2015-10-01'),
                end_date: new Date('2018-06-30'),
              },
              {
                school_name: 'Delete School',
                major: 'History',
                degree: 'BA',
                begin_date: new Date('2012-10-01'),
                end_date: new Date('2015-06-30'),
              },
            ],
          },
        },
      });

      const existing = await prisma.education.findMany({
        where: { user_id: user.id },
        orderBy: { id: 'asc' },
      });

      const mergeResponse = await request(app.getHttpServer())
        .put('/users/education')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({
          education: [
            {
              id: existing[0].id,
              schoolName: 'Legacy School Updated',
              major: 'Applied Math',
              degree: 'MSc',
              beginDate: '2015-10-01',
              endDate: '2019-06-30',
            },
            {
              schoolName: 'Fresh Academy',
              major: 'Software Engineering',
              degree: 'BSc',
              beginDate: '2020-10-01',
              endDate: '2023-06-30',
            },
          ],
        })
        .expect(200);

      expect(mergeResponse.body.metadata).toEqual({
        created: 1,
        updated: 1,
        deleted: 1,
      });

      const deleteAllResponse = await request(app.getHttpServer())
        .put('/users/education')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({ education: [] })
        .expect(200);

      expect(deleteAllResponse.body.metadata.deleted).toBe(2);
      expect(await prisma.education.count({ where: { user_id: user.id } })).toBe(0);
    });

    it('rejects foreign education ids and invalid payloads', async () => {
      const owner = await createUserRecord(prisma, {
        auth0_id: 'auth0|education-owner',
        phone_number: '+48600777013',
        email: 'education-owner@example.com',
      });
      const otherUser = await createUserRecord(prisma, {
        auth0_id: 'auth0|education-other',
        phone_number: '+48600777014',
        email: 'education-other@example.com',
      });

      const foreignRecord = await prisma.education.create({
        data: {
          user_id: otherUser.id,
          school_name: 'Foreign School',
          major: 'Biology',
          degree: 'BSc',
          begin_date: new Date('2019-10-01'),
          end_date: new Date('2022-06-30'),
        },
      });

      await request(app.getHttpServer())
        .put('/users/education')
        .set('x-user', xUserHeader(owner.auth0_id))
        .send({
          education: [
            {
              id: foreignRecord.id,
              schoolName: 'Hijack School',
              major: 'Chemistry',
              degree: 'MSc',
              beginDate: '2019-10-01',
              endDate: '2022-06-30',
            },
          ],
        })
        .expect(404);

      const invalidResponse = await request(app.getHttpServer())
        .put('/users/education')
        .set('x-user', xUserHeader(owner.auth0_id))
        .send({
          education: [
            {
              schoolName: 'AB',
              major: 'IT',
              degree: 'AA',
              beginDate: '2035-01-01',
            },
          ],
        })
        .expect(400);

      expect(invalidResponse.body.message).toEqual(
        expect.arrayContaining([
          'education.0.schoolName must be longer than or equal to 3 characters',
          'education.0.major must be longer than or equal to 3 characters',
          'education.0.degree must be longer than or equal to 3 characters',
          'education.0.maximal allowed date for beginDate is now',
        ]),
      );
    });
  });

  describe('links', () => {
    it('lists current and public links ordered by id desc', async () => {
      const user = await prisma.user.create({
        data: {
          auth0_id: 'auth0|links-list',
          name: 'Links',
          surname: 'List',
          phone_number: '+48500777021',
          email: 'links-list@example.com',
          city: 'Gdynia',
          profile_summary: 'Profile summary long enough for link listing tests.',
          links: {
            create: [
              { linkString: 'https://example.com/older' },
              { linkString: 'https://example.com/newer' },
            ],
          },
        },
      });

      const mine = await request(app.getHttpServer())
        .get('/users/links')
        .set('x-user', xUserHeader(user.auth0_id))
        .expect(200);

      expect(mine.body.data.map((item: { linkString: string }) => item.linkString)).toEqual([
        'https://example.com/newer',
        'https://example.com/older',
      ]);

      await request(app.getHttpServer())
        .get(`/users/${user.auth0_id}/links`)
        .expect(200);
    });

    it('bulk-merges links, supports delete-all and rejects invalid or foreign ids', async () => {
      const user = await prisma.user.create({
        data: {
          auth0_id: 'auth0|links-merge',
          name: 'Links',
          surname: 'Merge',
          phone_number: '+48500777022',
          email: 'links-merge@example.com',
          city: 'Sopot',
          profile_summary: 'Profile summary long enough for links merge tests.',
          links: {
            create: [
              { linkString: 'https://example.com/legacy-link' },
              { linkString: 'https://example.com/delete-link' },
            ],
          },
        },
      });

      const existing = await prisma.link.findMany({
        where: { user_id: user.id },
        orderBy: { id: 'asc' },
      });

      const mergeResponse = await request(app.getHttpServer())
        .put('/users/links')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({
          links: [
            {
              id: existing[0].id,
              linkString: 'https://example.com/legacy-link-updated',
            },
            {
              linkString: 'https://example.com/new-link',
            },
          ],
        })
        .expect(200);

      expect(mergeResponse.body.metadata).toEqual({
        created: 1,
        updated: 1,
        deleted: 1,
      });

      const deleteAllResponse = await request(app.getHttpServer())
        .put('/users/links')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({ links: [] })
        .expect(200);

      expect(deleteAllResponse.body.metadata.deleted).toBe(2);
      expect(await prisma.link.count({ where: { user_id: user.id } })).toBe(0);

      const otherUser = await createUserRecord(prisma, {
        auth0_id: 'auth0|links-other',
        phone_number: '+48600777023',
        email: 'links-other@example.com',
      });

      const foreignLink = await prisma.link.create({
        data: {
          user_id: otherUser.id,
          linkString: 'https://example.com/foreign-link',
        },
      });

      await request(app.getHttpServer())
        .put('/users/links')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({
          links: [
            {
              id: foreignLink.id,
              linkString: 'https://example.com/hijack',
            },
          ],
        })
        .expect(404);

      const invalidResponse = await request(app.getHttpServer())
        .put('/users/links')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({
          links: [{ linkString: 'ftp://invalid-link' }],
        })
        .expect(400);

      expect(invalidResponse.body.message).toEqual(
        expect.arrayContaining(['links.0.Link must start with http:// or https://']),
      );
    });
  });

  describe('certificates', () => {
    it('lists current and public certificates ordered by certification_date desc', async () => {
      const user = await prisma.user.create({
        data: {
          auth0_id: 'auth0|cert-list',
          name: 'Cert',
          surname: 'List',
          phone_number: '+48500777031',
          email: 'cert-list@example.com',
          city: 'Krakow',
          profile_summary: 'Profile summary long enough for certificate listing tests.',
          certificates: {
            create: [
              {
                name: 'Older Cert',
                issuer: 'Issuer A',
                certification_date: new Date('2022-01-01'),
              },
              {
                name: 'Newer Cert',
                issuer: 'Issuer B',
                certification_date: new Date('2024-01-01'),
              },
            ],
          },
        },
      });

      const mine = await request(app.getHttpServer())
        .get('/users/certificates')
        .set('x-user', xUserHeader(user.auth0_id))
        .expect(200);

      expect(mine.body.data.map((item: { name: string }) => item.name)).toEqual([
        'Newer Cert',
        'Older Cert',
      ]);

      await request(app.getHttpServer())
        .get(`/users/${user.auth0_id}/certificates`)
        .expect(200);
    });

    it('bulk-merges certificates, supports delete-all and validates ownership/payload', async () => {
      const user = await prisma.user.create({
        data: {
          auth0_id: 'auth0|cert-merge',
          name: 'Cert',
          surname: 'Merge',
          phone_number: '+48500777032',
          email: 'cert-merge@example.com',
          city: 'Lublin',
          profile_summary: 'Profile summary long enough for certificate merge tests.',
          certificates: {
            create: [
              {
                name: 'Legacy Cert',
                issuer: 'Issuer Legacy',
                certification_date: new Date('2022-05-01'),
              },
              {
                name: 'Delete Cert',
                issuer: 'Issuer Delete',
                certification_date: new Date('2021-05-01'),
              },
            ],
          },
        },
      });

      const existing = await prisma.certificate.findMany({
        where: { user_id: user.id },
        orderBy: { id: 'asc' },
      });

      const mergeResponse = await request(app.getHttpServer())
        .put('/users/certificates')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({
          certificates: [
            {
              id: existing[0].id,
              name: 'Legacy Cert Updated',
              issuer: 'Issuer Updated',
              certificationDate: '2024-05-01',
            },
            {
              name: 'Fresh Cert',
              issuer: 'Issuer Fresh',
              certificationDate: '2023-01-15',
            },
          ],
        })
        .expect(200);

      expect(mergeResponse.body.metadata).toEqual({
        created: 1,
        updated: 1,
        deleted: 1,
      });

      const deleteAllResponse = await request(app.getHttpServer())
        .put('/users/certificates')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({ certificates: [] })
        .expect(200);

      expect(deleteAllResponse.body.metadata.deleted).toBe(2);
      expect(await prisma.certificate.count({ where: { user_id: user.id } })).toBe(0);

      const otherUser = await createUserRecord(prisma, {
        auth0_id: 'auth0|cert-other',
        phone_number: '+48600777033',
        email: 'cert-other@example.com',
      });

      const foreignCert = await prisma.certificate.create({
        data: {
          user_id: otherUser.id,
          name: 'Foreign Cert',
          issuer: 'Other Issuer',
          certification_date: new Date('2022-01-01'),
        },
      });

      await request(app.getHttpServer())
        .put('/users/certificates')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({
          certificates: [
            {
              id: foreignCert.id,
              name: 'Hijack Cert',
              issuer: 'Hijack Issuer',
              certificationDate: '2022-01-01',
            },
          ],
        })
        .expect(404);

      const invalidResponse = await request(app.getHttpServer())
        .put('/users/certificates')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({
          certificates: [
            {
              name: 'AB',
              issuer: 'CD',
              certificationDate: '2035-01-01',
            },
          ],
        })
        .expect(400);

      expect(invalidResponse.body.message).toEqual(
        expect.arrayContaining([
          'certificates.0.name must be longer than or equal to 3 characters',
          'certificates.0.issuer must be longer than or equal to 3 characters',
          'certificates.0.maximal allowed date for certificationDate is now',
        ]),
      );
    });
  });

  describe('abilities', () => {
    it('lists current and public abilities ordered by id desc', async () => {
      const user = await prisma.user.create({
        data: {
          auth0_id: 'auth0|abilities-list',
          name: 'Ability',
          surname: 'List',
          phone_number: '+48500777041',
          email: 'abilities-list@example.com',
          city: 'Szczecin',
          profile_summary: 'Profile summary long enough for abilities listing tests.',
          abilities: {
            create: [{ name: 'TypeScript' }, { name: 'Docker' }],
          },
        },
      });

      const mine = await request(app.getHttpServer())
        .get('/users/abilities')
        .set('x-user', xUserHeader(user.auth0_id))
        .expect(200);

      expect(mine.body.data.map((item: { name: string }) => item.name)).toEqual([
        'Docker',
        'TypeScript',
      ]);

      await request(app.getHttpServer())
        .get(`/users/${user.auth0_id}/abilities`)
        .expect(200);
    });

    it('bulk-merges abilities, supports delete-all and validates ownership/payload', async () => {
      const user = await prisma.user.create({
        data: {
          auth0_id: 'auth0|abilities-merge',
          name: 'Ability',
          surname: 'Merge',
          phone_number: '+48500777042',
          email: 'abilities-merge@example.com',
          city: 'Bialystok',
          profile_summary: 'Profile summary long enough for ability merge tests.',
          abilities: {
            create: [{ name: 'Node.js' }, { name: 'Legacy Skill' }],
          },
        },
      });

      const existing = await prisma.abilities.findMany({
        where: { user_id: user.id },
        orderBy: { id: 'asc' },
      });

      const mergeResponse = await request(app.getHttpServer())
        .put('/users/abilities')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({
          abilities: [
            {
              id: existing[0].id,
              name: 'Node.js Advanced',
            },
            {
              name: 'Kubernetes',
            },
          ],
        })
        .expect(200);

      expect(mergeResponse.body.metadata).toEqual({
        created: 1,
        updated: 1,
        deleted: 1,
      });

      const deleteAllResponse = await request(app.getHttpServer())
        .put('/users/abilities')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({ abilities: [] })
        .expect(200);

      expect(deleteAllResponse.body.metadata.deleted).toBe(2);
      expect(await prisma.abilities.count({ where: { user_id: user.id } })).toBe(0);

      const otherUser = await createUserRecord(prisma, {
        auth0_id: 'auth0|abilities-other',
        phone_number: '+48600777043',
        email: 'abilities-other@example.com',
      });

      const foreignAbility = await prisma.abilities.create({
        data: {
          user_id: otherUser.id,
          name: 'Foreign Ability',
        },
      });

      await request(app.getHttpServer())
        .put('/users/abilities')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({
          abilities: [
            {
              id: foreignAbility.id,
              name: 'Hijack Ability',
            },
          ],
        })
        .expect(404);

      const invalidResponse = await request(app.getHttpServer())
        .put('/users/abilities')
        .set('x-user', xUserHeader(user.auth0_id))
        .send({
          abilities: [{ name: 'Go' }],
        })
        .expect(400);

      expect(invalidResponse.body.message).toEqual(
        expect.arrayContaining([
          'abilities.0.name must be longer than or equal to 3 characters',
        ]),
      );
    });
  });
});
