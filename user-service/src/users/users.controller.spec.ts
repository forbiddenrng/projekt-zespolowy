import { BadRequestException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const createUsersServiceMock = () =>
  ({
    create: jest.fn(),
    profileExistsForCurrentUser: jest.fn(),
    profileExistsByAuth0Id: jest.fn(),
    findOne: jest.fn(),
    updateCurrentUserProfile: jest.fn(),
    remove: jest.fn(),
  }) as unknown as jest.Mocked<UsersService>;

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(() => {
    usersService = createUsersServiceMock();
    controller = new UsersController(usersService);
  });

  it('creates user using id from x-user header and overrides body auth0Id', async () => {
    const dto = {
      auth0Id: 'auth0|body',
      name: 'Jan',
      surname: 'Kowalski',
      phoneNumber: '+48600100200',
      email: 'jan@example.com',
      city: 'Gdansk',
    };
    usersService.create.mockResolvedValue({ statusCode: 201 } as any);

    await controller.create({ userId: 'auth0|header' }, dto as any);

    expect(dto.auth0Id).toBe('auth0|header');
    expect(usersService.create).toHaveBeenCalledWith(dto);
  });

  it('rejects create when x-user header was not parsed', async () => {
    expect(() => controller.create({}, {} as any)).toThrow(BadRequestException);
  });

  it('checks current profile existence using req.userId', async () => {
    usersService.profileExistsForCurrentUser.mockResolvedValue({
      data: { exists: true },
    } as any);

    await controller.findMyProfileExists({ userId: 'auth0|current-user' });

    expect(usersService.profileExistsForCurrentUser).toHaveBeenCalledWith(
      'auth0|current-user',
    );
  });

  it('rejects current profile existence when user is missing', async () => {
    expect(() => controller.findMyProfileExists({})).toThrow(
      BadRequestException,
    );
  });

  it('delegates public profile existence check by auth0 id', async () => {
    await controller.findProfileExistsByAuth0Id('auth0|public');

    expect(usersService.profileExistsByAuth0Id).toHaveBeenCalledWith(
      'auth0|public',
    );
  });

  it('loads current user with forwarded query params', async () => {
    await controller.findMe(
      { userId: 'auth0|current-user' },
      'true',
      'false',
      'false',
      'true',
      'false',
      'false',
      'false',
    );

    expect(usersService.findOne).toHaveBeenCalledWith('auth0|current-user', {
      abilities: 'true',
      certificates: 'false',
      education: 'false',
      languages: 'true',
      links: 'false',
      work: 'false',
      all: 'false',
    });
  });

  it('rejects current user lookup without req.userId', async () => {
    expect(() =>
      controller.findMe(
        {},
        'false',
        'false',
        'false',
        'false',
        'false',
        'false',
        'false',
      ),
    ).toThrow(BadRequestException);
  });

  it('loads public user by auth0 id with forwarded query params', async () => {
    await controller.findOne(
      'auth0|public',
      'false',
      'true',
      'false',
      'false',
      'true',
      'false',
      'false',
    );

    expect(usersService.findOne).toHaveBeenCalledWith('auth0|public', {
      abilities: 'false',
      certificates: 'true',
      education: 'false',
      languages: 'false',
      links: 'true',
      work: 'false',
      all: 'false',
    });
  });

  it('updates current user profile using req.userId', async () => {
    const dto = { city: 'Sopot' };

    await controller.updateCurrentUser({ userId: 'auth0|current-user' }, dto);

    expect(usersService.updateCurrentUserProfile).toHaveBeenCalledWith(
      'auth0|current-user',
      dto,
    );
  });

  it('removes user by auth0 id', async () => {
    await controller.remove('auth0|delete-me');

    expect(usersService.remove).toHaveBeenCalledWith('auth0|delete-me');
  });
});
