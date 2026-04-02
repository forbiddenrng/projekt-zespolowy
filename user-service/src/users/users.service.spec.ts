import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type MockFn = jest.Mock<any, any>;

type DatabaseMock = {
  user: Record<string, MockFn>;
  work_Experience: Record<string, MockFn>;
  education: Record<string, MockFn>;
  link: Record<string, MockFn>;
  certificate: Record<string, MockFn>;
  abilities: Record<string, MockFn>;
  languages: Record<string, MockFn>;
  user_Languages: Record<string, MockFn>;
  $transaction: MockFn;
};

const createDatabaseMock = (): DatabaseMock => {
  const db = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    work_Experience: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    education: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    link: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    certificate: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    abilities: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    languages: {
      findMany: jest.fn(),
    },
    user_Languages: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  } as DatabaseMock;

  db.$transaction.mockImplementation(async (callback: (tx: any) => unknown) =>
    callback(db),
  );

  return db;
};

describe('UsersService', () => {
  let service: UsersService;
  let database: DatabaseMock;

  const currentUser = {
    id: 7,
    auth0_id: 'auth0|current-user',
    email: 'jan@example.com',
  };

  beforeEach(() => {
    database = createDatabaseMock();
    service = new UsersService(database as unknown as DatabaseService);
  });

  describe('create', () => {
    it('creates a user and maps nested relations to Prisma shape', async () => {
      const dto: CreateUserDto = {
        auth0Id: 'auth0|header-user',
        name: 'Jan',
        surname: 'Kowalski',
        phoneNumber: '+48600100200',
        email: 'jan@example.com',
        city: 'Gdansk',
        profileSummary: 'Doświadczony programista backend z naciskiem na API.',
        abilities: [{ name: 'TypeScript' }],
        certificates: [
          {
            name: 'AWS Associate',
            issuer: 'Amazon',
            certificationDate: '2024-05-01T00:00:00.000Z',
          },
        ],
        education: [
          {
            schoolName: 'UG',
            major: 'Informatyka',
            degree: 'Mgr',
            beginDate: '2020-10-01T00:00:00.000Z',
            endDate: '2022-06-30T00:00:00.000Z',
          },
        ],
        links: [{ linkString: 'https://github.com/jan' }],
        workExperience: [
          {
            companyName: 'Acme',
            position: 'Backend Dev',
            beginDate: '2022-01-01T00:00:00.000Z',
            endDate: '2024-01-01T00:00:00.000Z',
            description: 'Budowa i utrzymanie usług backendowych.',
          },
        ],
        languages: [{ languageId: 1, level: 'B2' }],
      };

      database.user.findFirst.mockResolvedValue(null);
      database.user.create.mockResolvedValue({
        id: 7,
        name: 'Jan',
        surname: 'Kowalski',
        email: 'jan@example.com',
      });

      const result = await service.create(dto);

      expect(database.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { auth0_id: 'auth0|header-user' },
            { email: 'jan@example.com' },
            { phone_number: '+48600100200' },
          ],
        },
      });

      const createArgs = database.user.create.mock.calls[0][0];
      expect(createArgs.data).toMatchObject({
        auth0_id: 'auth0|header-user',
        name: 'Jan',
        surname: 'Kowalski',
        phone_number: '+48600100200',
        email: 'jan@example.com',
        city: 'Gdansk',
        profile_summary: 'Doświadczony programista backend z naciskiem na API.',
      });
      expect(createArgs.data.abilities.create).toEqual([{ name: 'TypeScript' }]);
      expect(createArgs.data.certificates.create[0]).toEqual({
        name: 'AWS Associate',
        issuer: 'Amazon',
        certification_date: '2024-05-01T00:00:00.000Z',
      });
      expect(createArgs.data.education.create[0]).toEqual({
        school_name: 'UG',
        major: 'Informatyka',
        degree: 'Mgr',
        begin_date: new Date('2020-10-01T00:00:00.000Z'),
        end_date: new Date('2022-06-30T00:00:00.000Z'),
      });
      expect(createArgs.data.links.create).toEqual([
        { linkString: 'https://github.com/jan' },
      ]);
      expect(createArgs.data.work_experiences.create[0]).toEqual({
        company_name: 'Acme',
        position: 'Backend Dev',
        description: 'Budowa i utrzymanie usług backendowych.',
        begin_date: new Date('2022-01-01T00:00:00.000Z'),
        end_date: new Date('2024-01-01T00:00:00.000Z'),
      });
      expect(createArgs.data.user_languages.create).toEqual([
        { language: { connect: { id: 1 } }, level: 'B2' },
      ]);
      expect(result).toEqual({
        statusCode: 201,
        message: 'User successfully created',
        data: {
          id: 7,
          name: 'Jan',
          surname: 'Kowalski',
          email: 'jan@example.com',
        },
      });
    });

    it('creates a minimal user without optional relations', async () => {
      database.user.findFirst.mockResolvedValue(null);
      database.user.create.mockResolvedValue({
        id: 8,
        name: 'Anna',
        surname: 'Nowak',
        email: 'anna@example.com',
      });

      await service.create({
        auth0Id: 'auth0|minimal',
        name: 'Anna',
        surname: 'Nowak',
        phoneNumber: '+48600100300',
        email: 'anna@example.com',
        city: 'Gdynia',
      } as CreateUserDto);

      const createArgs = database.user.create.mock.calls[0][0];
      expect(createArgs.data).toMatchObject({
        auth0_id: 'auth0|minimal',
        phone_number: '+48600100300',
        city: 'Gdynia',
      });
      expect(createArgs.data.abilities).toBeUndefined();
      expect(createArgs.data.user_languages).toBeUndefined();
      expect(createArgs.data.profile_summary).toBeUndefined();
    });

    it('rejects duplicate user by auth0_id/email/phone', async () => {
      database.user.findFirst.mockResolvedValue({ id: 99 });

      await expect(
        service.create({
          auth0Id: 'auth0|duplicate',
          name: 'Jan',
          surname: 'Kowalski',
          phoneNumber: '+48600100200',
          email: 'jan@example.com',
          city: 'Gdansk',
        } as CreateUserDto),
      ).rejects.toThrow(BadRequestException);

      expect(database.user.create).not.toHaveBeenCalled();
    });
  });

  describe('profile existence', () => {
    it('rejects current profile existence check without current user id', async () => {
      await expect(
        service.profileExistsForCurrentUser(undefined),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns exists=true when public profile exists', async () => {
      database.user.findUnique.mockResolvedValue({ id: 7 });

      await expect(service.profileExistsByAuth0Id('auth0|exists')).resolves.toEqual(
        {
          statusCode: 200,
          message: 'User exists',
          data: { exists: true },
        },
      );
    });

    it('returns exists=false when public profile does not exist', async () => {
      database.user.findUnique.mockResolvedValue(null);

      await expect(
        service.profileExistsByAuth0Id('auth0|missing'),
      ).resolves.toEqual({
        statusCode: 200,
        message: 'User not found',
        data: { exists: false },
      });
    });
  });

  describe('findOne', () => {
    it('builds relation-aware Prisma select for all=true', async () => {
      database.user.findUnique.mockResolvedValue({
        id: 7,
        name: 'Jan',
      });

      await service.findOne('auth0|current-user', {
        abilities: 'false',
        certificates: 'false',
        education: 'false',
        languages: 'false',
        links: 'false',
        work: 'false',
        all: 'true',
      });

      expect(database.user.findUnique).toHaveBeenCalledWith({
        where: { auth0_id: 'auth0|current-user' },
        select: {
          id: true,
          auth0_id: true,
          name: true,
          surname: true,
          phone_number: true,
          email: true,
          city: true,
          profile_summary: true,
          abilities: { omit: { user_id: true } },
          certificates: { omit: { user_id: true } },
          education: { omit: { user_id: true } },
          links: { omit: { user_id: true } },
          work_experiences: { omit: { user_id: true } },
          user_languages: {
            select: {
              id: true,
              level: true,
              language: true,
            },
          },
        },
      });
    });

    it('throws when user cannot be found', async () => {
      database.user.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('auth0|missing', {
          abilities: 'false',
          certificates: 'false',
          education: 'false',
          languages: 'false',
          links: 'false',
          work: 'false',
          all: 'false',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('builds relation-aware Prisma select for a single requested relation', async () => {
      database.user.findUnique.mockResolvedValue({
        id: 7,
        auth0_id: 'auth0|current-user',
      });

      await service.findOne('auth0|current-user', {
        abilities: 'false',
        certificates: 'false',
        education: 'false',
        languages: 'true',
        links: 'false',
        work: 'false',
        all: 'false',
      });

      expect(database.user.findUnique).toHaveBeenCalledWith({
        where: { auth0_id: 'auth0|current-user' },
        select: expect.objectContaining({
          user_languages: {
            select: {
              id: true,
              level: true,
              language: true,
            },
          },
        }),
      });
      expect(database.user.findUnique.mock.calls[0][0].select.abilities).toBeUndefined();
    });
  });

  describe('updateCurrentUserProfile', () => {
    it('requires current user id', async () => {
      await expect(
        service.updateCurrentUserProfile(undefined, {} as UpdateUserDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when current user does not exist', async () => {
      database.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCurrentUserProfile('auth0|missing', {
          city: 'Gdansk',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects empty update payload', async () => {
      database.user.findUnique.mockResolvedValue(currentUser);

      await expect(
        service.updateCurrentUserProfile('auth0|current-user', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('updates only provided fields', async () => {
      database.user.findUnique.mockResolvedValue(currentUser);
      database.user.update.mockResolvedValue({
        id: 7,
        auth0_id: 'auth0|current-user',
        name: 'Janusz',
        surname: 'Kowalski',
        phone_number: '+48600100200',
        email: 'jan@example.com',
        city: 'Sopot',
        profile_summary: 'Nowe podsumowanie zawodowe z odpowiednią długością.',
      });

      const result = await service.updateCurrentUserProfile(
        'auth0|current-user',
        {
          name: 'Janusz',
          city: 'Sopot',
          profileSummary:
            'Nowe podsumowanie zawodowe z odpowiednią długością.',
        },
      );

      expect(database.user.update).toHaveBeenCalledWith({
        where: { auth0_id: 'auth0|current-user' },
        data: {
          name: 'Janusz',
          city: 'Sopot',
          profile_summary:
            'Nowe podsumowanie zawodowe z odpowiednią długością.',
        },
        select: {
          id: true,
          auth0_id: true,
          name: true,
          surname: true,
          phone_number: true,
          email: true,
          city: true,
          profile_summary: true,
        },
      });
      expect(result.statusCode).toBe(200);
    });
  });

  describe('remove', () => {
    it('deletes user by auth0 id', async () => {
      database.user.delete.mockResolvedValue({
        id: 7,
        auth0_id: 'auth0|current-user',
      });

      await expect(service.remove('auth0|current-user')).resolves.toEqual({
        statusCode: 200,
        message: 'User successfully deleted',
        data: {
          id: 7,
          auth0_id: 'auth0|current-user',
        },
      });
    });

    it('throws when delete returned no user', async () => {
      database.user.delete.mockResolvedValue(null);

      await expect(service.remove('auth0|missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe.each([
    {
      label: 'work experiences',
      mineMethod: 'listWorkExperiencesForCurrentUser',
      publicMethod: 'listWorkExperiencesByAuth0Id',
      model: 'work_Experience',
      orderBy: { begin_date: 'desc' },
      items: [{ id: 1, position: 'Backend Dev' }],
    },
    {
      label: 'education',
      mineMethod: 'listEducationForCurrentUser',
      publicMethod: 'listEducationByAuth0Id',
      model: 'education',
      orderBy: { begin_date: 'desc' },
      items: [{ id: 1, school_name: 'UG' }],
    },
    {
      label: 'links',
      mineMethod: 'listLinksForCurrentUser',
      publicMethod: 'listLinksByAuth0Id',
      model: 'link',
      orderBy: { id: 'desc' },
      items: [{ id: 1, linkString: 'https://github.com/jan' }],
    },
    {
      label: 'certificates',
      mineMethod: 'listCertificatesForCurrentUser',
      publicMethod: 'listCertificatesByAuth0Id',
      model: 'certificate',
      orderBy: { certification_date: 'desc' },
      items: [{ id: 1, name: 'AWS Associate' }],
    },
    {
      label: 'abilities',
      mineMethod: 'listAbilitiesForCurrentUser',
      publicMethod: 'listAbilitiesByAuth0Id',
      model: 'abilities',
      orderBy: { id: 'desc' },
      items: [{ id: 1, name: 'TypeScript' }],
    },
  ])('$label listing', ({ mineMethod, publicMethod, model, orderBy, items }) => {
    it('requires current user id for mine endpoint', async () => {
      await expect((service as any)[mineMethod](undefined)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('loads current user records', async () => {
      database.user.findUnique.mockResolvedValue(currentUser);
      (database as any)[model].findMany.mockResolvedValue(items);

      const result = await (service as any)[mineMethod]('auth0|current-user');

      expect(database.user.findUnique).toHaveBeenCalledWith({
        where: { auth0_id: 'auth0|current-user' },
      });
      expect((database as any)[model].findMany).toHaveBeenCalledWith({
        where: { user_id: currentUser.id },
        orderBy,
      });
      expect(result.data).toEqual(items);
    });

    it('throws when public user does not exist', async () => {
      database.user.findUnique.mockResolvedValue(null);

      await expect((service as any)[publicMethod]('auth0|missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('loads public user records', async () => {
      database.user.findUnique.mockResolvedValue(currentUser);
      (database as any)[model].findMany.mockResolvedValue(items);

      const result = await (service as any)[publicMethod]('auth0|public-user');

      expect((database as any)[model].findMany).toHaveBeenCalledWith({
        where: { user_id: currentUser.id },
        orderBy,
      });
      expect(result.data).toEqual(items);
    });
  });

  describe('languages listing', () => {
    it('returns all available languages', async () => {
      database.languages.findMany.mockResolvedValue([
        { id: 1, name: 'English', code: 'en' },
      ]);

      await expect(service.getAllLanguages()).resolves.toEqual({
        statusCode: 200,
        message: 'Languages fetched',
        data: [{ id: 1, name: 'English', code: 'en' }],
      });
      expect(database.languages.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });

    it('returns current user languages with joined language relation', async () => {
      database.user.findUnique.mockResolvedValue(currentUser);
      database.user_Languages.findMany.mockResolvedValue([
        {
          id: 1,
          level: 'B2',
          language: { id: 1, name: 'English', code: 'en' },
        },
      ]);

      const result = await service.listLanguagesForCurrentUser(
        'auth0|current-user',
      );

      expect(database.user_Languages.findMany).toHaveBeenCalledWith({
        where: { user_id: currentUser.id },
        orderBy: { id: 'desc' },
        select: {
          id: true,
          level: true,
          language: true,
        },
      });
      expect(result.data).toHaveLength(1);
    });

    it('throws when current user languages are requested without current user id', async () => {
      await expect(service.listLanguagesForCurrentUser(undefined)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws when public user languages are requested for a missing user', async () => {
      database.user.findUnique.mockResolvedValue(null);

      await expect(service.listLanguagesByAuth0Id('auth0|missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns languages for public user', async () => {
      database.user.findUnique.mockResolvedValue(currentUser);
      database.user_Languages.findMany.mockResolvedValue([
        {
          id: 2,
          level: 'C1',
          language: { id: 1, name: 'English', code: 'en' },
        },
      ]);

      const result = await service.listLanguagesByAuth0Id('auth0|public-user');

      expect(result.data).toEqual([
        {
          id: 2,
          level: 'C1',
          language: { id: 1, name: 'English', code: 'en' },
        },
      ]);
    });
  });

  describe.each([
    {
      label: 'work experiences',
      method: 'mergeWorkExperiences',
      model: 'work_Experience',
      payload: {
        workExperiences: [
          {
            id: 1,
            companyName: 'Acme',
            position: 'Senior Backend Dev',
            beginDate: '2022-01-01T00:00:00.000Z',
            endDate: '2024-01-01T00:00:00.000Z',
            description: 'Rozwój platformy backendowej i utrzymanie usług.',
          },
          {
            companyName: 'Beta',
            position: 'Tech Lead',
            beginDate: '2024-02-01T00:00:00.000Z',
            description: 'Prowadzenie zespołu backendowego.',
          },
        ],
      },
      existing: [
        { id: 1, user_id: 7, company_name: 'Acme' },
        { id: 2, user_id: 7, company_name: 'Old company' },
      ],
      updated: { id: 1, company_name: 'Acme' },
      created: { id: 3, company_name: 'Beta' },
    },
    {
      label: 'education',
      method: 'mergeEducation',
      model: 'education',
      payload: {
        education: [
          {
            id: 1,
            schoolName: 'UG',
            major: 'Informatyka',
            degree: 'Mgr',
            beginDate: '2020-10-01T00:00:00.000Z',
            endDate: '2022-06-30T00:00:00.000Z',
          },
          {
            schoolName: 'Politechnika',
            major: 'Automatyka',
            degree: 'Inz',
            beginDate: '2016-10-01T00:00:00.000Z',
            endDate: '2020-06-30T00:00:00.000Z',
          },
        ],
      },
      existing: [
        { id: 1, user_id: 7, school_name: 'UG' },
        { id: 2, user_id: 7, school_name: 'Old school' },
      ],
      updated: { id: 1, school_name: 'UG' },
      created: { id: 3, school_name: 'Politechnika' },
    },
    {
      label: 'links',
      method: 'mergeLinks',
      model: 'link',
      payload: {
        links: [
          { id: 1, linkString: 'https://github.com/new-profile' },
          { linkString: 'https://linkedin.com/in/jan' },
        ],
      },
      existing: [
        { id: 1, user_id: 7, linkString: 'https://github.com/old' },
        { id: 2, user_id: 7, linkString: 'https://example.com/old' },
      ],
      updated: { id: 1, linkString: 'https://github.com/new-profile' },
      created: { id: 3, linkString: 'https://linkedin.com/in/jan' },
    },
    {
      label: 'certificates',
      method: 'mergeCertificates',
      model: 'certificate',
      payload: {
        certificates: [
          {
            id: 1,
            name: 'AWS Associate',
            issuer: 'Amazon',
            certificationDate: '2024-05-01T00:00:00.000Z',
          },
          {
            name: 'Azure Fundamentals',
            issuer: 'Microsoft',
            certificationDate: '2024-06-01T00:00:00.000Z',
          },
        ],
      },
      existing: [
        { id: 1, user_id: 7, name: 'AWS Associate' },
        { id: 2, user_id: 7, name: 'Old cert' },
      ],
      updated: { id: 1, name: 'AWS Associate' },
      created: { id: 3, name: 'Azure Fundamentals' },
    },
    {
      label: 'abilities',
      method: 'mergeAbilities',
      model: 'abilities',
      payload: {
        abilities: [
          { id: 1, name: 'TypeScript' },
          { name: 'NestJS' },
        ],
      },
      existing: [
        { id: 1, user_id: 7, name: 'TypeScript' },
        { id: 2, user_id: 7, name: 'Old skill' },
      ],
      updated: { id: 1, name: 'TypeScript' },
      created: { id: 3, name: 'NestJS' },
    },
  ])('$label merge', ({ method, model, payload, existing, updated, created }) => {
    it('synchronizes create/update/delete operations and returns metadata', async () => {
      database.user.findUnique.mockResolvedValue(currentUser);
      (database as any)[model].findMany.mockResolvedValue(existing);
      (database as any)[model].deleteMany.mockResolvedValue({ count: 1 });
      (database as any)[model].update.mockResolvedValue(updated);
      (database as any)[model].create.mockResolvedValue(created);

      const result = await (service as any)[method]('auth0|current-user', payload);

      expect(database.$transaction).toHaveBeenCalled();
      expect((database as any)[model].deleteMany).toHaveBeenCalledTimes(1);
      expect((database as any)[model].update).toHaveBeenCalledTimes(1);
      expect((database as any)[model].create).toHaveBeenCalledTimes(1);
      expect(result.metadata).toEqual({
        created: 1,
        updated: 1,
        deleted: 1,
      });
      expect(result.data).toEqual([updated, created]);
    });
  });

  describe('mergeWorkExperiences', () => {
    it('throws when updating record that does not belong to current user', async () => {
      database.user.findUnique.mockResolvedValue(currentUser);
      database.work_Experience.findMany.mockResolvedValue([]);

      await expect(
        service.mergeWorkExperiences('auth0|current-user', {
          workExperiences: [
            {
              id: 999,
              companyName: 'Acme',
              position: 'Backend Dev',
              beginDate: '2022-01-01T00:00:00.000Z',
              description: 'Budowa i utrzymanie usług backendowych.',
            },
          ],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when current user is missing before merge', async () => {
      database.user.findUnique.mockResolvedValue(null);

      await expect(
        service.mergeWorkExperiences('auth0|missing', { workExperiences: [] }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe.each([
    ['mergeEducation', 'education', { education: [{ id: 999, schoolName: 'UG', major: 'Informatyka', degree: 'Mgr', beginDate: '2020-10-01T00:00:00.000Z' }] }],
    ['mergeLinks', 'link', { links: [{ id: 999, linkString: 'https://github.com/jan' }] }],
    ['mergeCertificates', 'certificate', { certificates: [{ id: 999, name: 'AWS Associate', issuer: 'Amazon', certificationDate: '2024-05-01T00:00:00.000Z' }] }],
    ['mergeAbilities', 'abilities', { abilities: [{ id: 999, name: 'TypeScript' }] }],
  ])('%s', (method, model, payload) => {
    it('throws when referenced record id does not belong to current user', async () => {
      database.user.findUnique.mockResolvedValue(currentUser);
      (database as any)[model].findMany.mockResolvedValue([]);

      await expect(
        (service as any)[method]('auth0|current-user', payload),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when current user does not exist', async () => {
      database.user.findUnique.mockResolvedValue(null);

      await expect((service as any)[method]('auth0|missing', payload)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('mergeLanguages', () => {
    it('requires current user id', async () => {
      await expect(
        service.mergeLanguages(undefined, { languages: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when current user cannot be found', async () => {
      database.user.findUnique.mockResolvedValue(null);

      await expect(
        service.mergeLanguages('auth0|missing', { languages: [] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects duplicate language ids inside payload', async () => {
      database.user.findUnique.mockResolvedValue(currentUser);

      await expect(
        service.mergeLanguages('auth0|current-user', {
          languages: [
            { languageId: 1, level: 'B2' },
            { languageId: 1, level: 'C1' },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects non-existing language ids', async () => {
      database.user.findUnique.mockResolvedValue(currentUser);
      database.languages.findMany.mockResolvedValue([{ id: 1 }]);

      await expect(
        service.mergeLanguages('auth0|current-user', {
          languages: [{ languageId: 2, level: 'B2' }],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects duplicate language already present for user on create', async () => {
      database.user.findUnique.mockResolvedValue(currentUser);
      database.languages.findMany.mockResolvedValue([
        { id: 1, name: 'English', code: 'en' },
      ]);
      database.user_Languages.findMany.mockResolvedValue([]);
      database.user_Languages.findFirst.mockResolvedValue({
        id: 20,
        user_id: 7,
        language_id: 1,
      });

      await expect(
        service.mergeLanguages('auth0|current-user', {
          languages: [{ languageId: 1, level: 'B2' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects duplicate language already present for user on update', async () => {
      database.user.findUnique.mockResolvedValue(currentUser);
      database.languages.findMany.mockResolvedValue([
        { id: 1, name: 'English', code: 'en' },
      ]);
      database.user_Languages.findMany.mockResolvedValue([
        {
          id: 10,
          user_id: 7,
          language_id: 1,
          level: 'B1',
          language: { id: 1, name: 'English', code: 'en' },
        },
      ]);
      database.user_Languages.findFirst.mockResolvedValue({
        id: 11,
        user_id: 7,
        language_id: 1,
      });

      await expect(
        service.mergeLanguages('auth0|current-user', {
          languages: [{ id: 10, languageId: 1, level: 'C1' }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('handles empty payload by deleting all existing user languages', async () => {
      database.user.findUnique.mockResolvedValue(currentUser);
      database.languages.findMany.mockResolvedValue([]);
      database.user_Languages.findMany.mockResolvedValue([
        {
          id: 10,
          user_id: 7,
          language_id: 1,
          level: 'B1',
          language: { id: 1, name: 'English', code: 'en' },
        },
      ]);
      database.user_Languages.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.mergeLanguages('auth0|current-user', {
        languages: [],
      });

      expect(database.user_Languages.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [10] }, user_id: currentUser.id },
      });
      expect(result).toEqual({
        statusCode: 200,
        message: 'Languages synchronized',
        data: [],
        metadata: {
          created: 0,
          updated: 0,
          deleted: 1,
        },
      });
    });

    it('synchronizes language relations with create/update/delete metadata', async () => {
      database.user.findUnique.mockResolvedValue(currentUser);
      database.languages.findMany.mockResolvedValue([
        { id: 1, name: 'English', code: 'en' },
        { id: 2, name: 'Polish', code: 'pl' },
      ]);
      database.user_Languages.findMany.mockResolvedValue([
        {
          id: 10,
          user_id: 7,
          language_id: 1,
          level: 'B1',
          language: { id: 1, name: 'English', code: 'en' },
        },
        {
          id: 11,
          user_id: 7,
          language_id: 3,
          level: 'A2',
          language: { id: 3, name: 'German', code: 'de' },
        },
      ]);
      database.user_Languages.findFirst.mockResolvedValue(null);
      database.user_Languages.deleteMany.mockResolvedValue({ count: 1 });
      database.user_Languages.update.mockResolvedValue({
        id: 10,
        level: 'C1',
        language: { id: 1, name: 'English', code: 'en' },
      });
      database.user_Languages.create.mockResolvedValue({
        id: 12,
        level: 'Native',
        language: { id: 2, name: 'Polish', code: 'pl' },
      });

      const result = await service.mergeLanguages('auth0|current-user', {
        languages: [
          { id: 10, languageId: 1, level: 'C1' },
          { languageId: 2, level: 'Native' },
        ],
      });

      expect(database.user_Languages.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [11] }, user_id: currentUser.id },
      });
      expect(result.metadata).toEqual({
        created: 1,
        updated: 1,
        deleted: 1,
      });
      expect(result.data).toEqual([
        {
          id: 10,
          level: 'C1',
          language: { id: 1, name: 'English', code: 'en' },
        },
        {
          id: 12,
          level: 'Native',
          language: { id: 2, name: 'Polish', code: 'pl' },
        },
      ]);
    });
  });
});
