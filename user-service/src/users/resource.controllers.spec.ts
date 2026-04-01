import { AbilitiesController } from './abilities.controller';
import { CertificatesController } from './certificates.controller';
import { EducationController } from './education.controller';
import { LanguagesController } from './languages.controller';
import { LinksController } from './links.controller';
import { UsersService } from './users.service';
import { WorkExperienceController } from './work-experience.controller';

const createUsersServiceMock = () =>
  ({
    listWorkExperiencesForCurrentUser: jest.fn(),
    listWorkExperiencesByAuth0Id: jest.fn(),
    mergeWorkExperiences: jest.fn(),
    listEducationForCurrentUser: jest.fn(),
    listEducationByAuth0Id: jest.fn(),
    mergeEducation: jest.fn(),
    listLinksForCurrentUser: jest.fn(),
    listLinksByAuth0Id: jest.fn(),
    mergeLinks: jest.fn(),
    listCertificatesForCurrentUser: jest.fn(),
    listCertificatesByAuth0Id: jest.fn(),
    mergeCertificates: jest.fn(),
    listAbilitiesForCurrentUser: jest.fn(),
    listAbilitiesByAuth0Id: jest.fn(),
    mergeAbilities: jest.fn(),
    listLanguagesForCurrentUser: jest.fn(),
    getAllLanguages: jest.fn(),
    listLanguagesByAuth0Id: jest.fn(),
    mergeLanguages: jest.fn(),
  }) as unknown as jest.Mocked<UsersService>;

describe('Resource controllers', () => {
  let usersService: jest.Mocked<UsersService>;

  beforeEach(() => {
    usersService = createUsersServiceMock();
  });

  it('WorkExperienceController delegates all routes to UsersService', async () => {
    const controller = new WorkExperienceController(usersService);
    const body = { workExperiences: [] };

    await controller.findMine({ userId: 'auth0|me' });
    await controller.findByAuth0Id('auth0|public');
    await controller.bulkMerge({ userId: 'auth0|me' }, body as any);

    expect(usersService.listWorkExperiencesForCurrentUser).toHaveBeenCalledWith(
      'auth0|me',
    );
    expect(usersService.listWorkExperiencesByAuth0Id).toHaveBeenCalledWith(
      'auth0|public',
    );
    expect(usersService.mergeWorkExperiences).toHaveBeenCalledWith(
      'auth0|me',
      body,
    );
  });

  it('EducationController delegates all routes to UsersService', async () => {
    const controller = new EducationController(usersService);
    const body = { education: [] };

    await controller.findMine({ userId: 'auth0|me' });
    await controller.findByAuth0Id('auth0|public');
    await controller.bulkMerge({ userId: 'auth0|me' }, body as any);

    expect(usersService.listEducationForCurrentUser).toHaveBeenCalledWith(
      'auth0|me',
    );
    expect(usersService.listEducationByAuth0Id).toHaveBeenCalledWith(
      'auth0|public',
    );
    expect(usersService.mergeEducation).toHaveBeenCalledWith('auth0|me', body);
  });

  it('LinksController delegates all routes to UsersService', async () => {
    const controller = new LinksController(usersService);
    const body = { links: [] };

    await controller.findMine({ userId: 'auth0|me' });
    await controller.findByAuth0Id('auth0|public');
    await controller.bulkMerge({ userId: 'auth0|me' }, body as any);

    expect(usersService.listLinksForCurrentUser).toHaveBeenCalledWith('auth0|me');
    expect(usersService.listLinksByAuth0Id).toHaveBeenCalledWith('auth0|public');
    expect(usersService.mergeLinks).toHaveBeenCalledWith('auth0|me', body);
  });

  it('CertificatesController delegates all routes to UsersService', async () => {
    const controller = new CertificatesController(usersService);
    const body = { certificates: [] };

    await controller.findMine({ userId: 'auth0|me' });
    await controller.findByAuth0Id('auth0|public');
    await controller.bulkMerge({ userId: 'auth0|me' }, body as any);

    expect(usersService.listCertificatesForCurrentUser).toHaveBeenCalledWith(
      'auth0|me',
    );
    expect(usersService.listCertificatesByAuth0Id).toHaveBeenCalledWith(
      'auth0|public',
    );
    expect(usersService.mergeCertificates).toHaveBeenCalledWith(
      'auth0|me',
      body,
    );
  });

  it('AbilitiesController delegates all routes to UsersService', async () => {
    const controller = new AbilitiesController(usersService);
    const body = { abilities: [] };

    await controller.findMine({ userId: 'auth0|me' });
    await controller.findByAuth0Id('auth0|public');
    await controller.bulkMerge({ userId: 'auth0|me' }, body as any);

    expect(usersService.listAbilitiesForCurrentUser).toHaveBeenCalledWith(
      'auth0|me',
    );
    expect(usersService.listAbilitiesByAuth0Id).toHaveBeenCalledWith(
      'auth0|public',
    );
    expect(usersService.mergeAbilities).toHaveBeenCalledWith('auth0|me', body);
  });

  it('LanguagesController delegates all routes to UsersService', async () => {
    const controller = new LanguagesController(usersService);
    const body = { languages: [] };

    await controller.findMine({ userId: 'auth0|me' });
    await controller.findAll({ userId: 'auth0|me' });
    await controller.findByAuth0Id('auth0|public');
    await controller.bulkMerge({ userId: 'auth0|me' }, body as any);

    expect(usersService.listLanguagesForCurrentUser).toHaveBeenCalledWith(
      'auth0|me',
    );
    expect(usersService.getAllLanguages).toHaveBeenCalled();
    expect(usersService.listLanguagesByAuth0Id).toHaveBeenCalledWith(
      'auth0|public',
    );
    expect(usersService.mergeLanguages).toHaveBeenCalledWith('auth0|me', body);
  });
});
