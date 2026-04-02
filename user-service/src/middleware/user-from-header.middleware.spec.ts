import { UserFromHeaderMiddleware } from './user-from-header.middleware';

describe('UserFromHeaderMiddleware', () => {
  let middleware: UserFromHeaderMiddleware;
  let next: jest.Mock;

  beforeEach(() => {
    middleware = new UserFromHeaderMiddleware();
    next = jest.fn();
  });

  it('sets req.userId to null when header is missing', () => {
    const req: any = { headers: {} };

    middleware.use(req, {} as any, next);

    expect(req.userId).toBeNull();
    expect(next).toHaveBeenCalled();
  });

  it('parses JSON object header with id field', () => {
    const req: any = { headers: { 'x-user': '{"id":"auth0|123"}' } };

    middleware.use(req, {} as any, next);

    expect(req.userId).toBe('auth0|123');
  });

  it('parses JSON object header with sub field', () => {
    const req: any = { headers: { 'x-user': '{"sub":"auth0|sub-user"}' } };

    middleware.use(req, {} as any, next);

    expect(req.userId).toBe('auth0|sub-user');
  });

  it('parses raw string header', () => {
    const req: any = { headers: { 'x-user': 'auth0|raw-user' } };

    middleware.use(req, {} as any, next);

    expect(req.userId).toBe('auth0|raw-user');
  });

  it('parses quoted JSON header', () => {
    const req: any = { headers: { 'x-user': '"{\\"id\\":\\"auth0|quoted\\"}"' } };

    middleware.use(req, {} as any, next);

    expect(req.userId).toBe('auth0|quoted');
  });

  it('falls back to null when header access fails', () => {
    const req: any = {
      headers: {
        get 'x-user'() {
          throw new Error('header access failed');
        },
      },
    };

    middleware.use(req, {} as any, next);

    expect(req.userId).toBeNull();
    expect(next).toHaveBeenCalled();
  });

  it('keeps trimmed string when quoted payload cannot be parsed as JSON object', () => {
    const req: any = { headers: { 'x-user': '"not-json-object"' } };

    middleware.use(req, {} as any, next);

    expect(req.userId).toBe('not-json-object');
  });

  it('sets userId to null for unsupported parsed types', () => {
    const req: any = { headers: { 'x-user': '123' } };

    middleware.use(req, {} as any, next);

    expect(req.userId).toBeNull();
  });
});
