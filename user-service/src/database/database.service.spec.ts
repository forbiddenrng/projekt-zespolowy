import { DatabaseService } from './database.service';

describe('DatabaseService', () => {
  it('connects Prisma client during module init', async () => {
    const service = new DatabaseService();
    const connectSpy = jest
      .spyOn(service, '$connect')
      .mockResolvedValue(undefined as never);

    await service.onModuleInit();

    expect(connectSpy).toHaveBeenCalled();
  });
});
