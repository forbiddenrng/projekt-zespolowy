import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MaxNow } from './max-now.validator';

class MaxNowDto {
  @MaxNow()
  value?: string | Date | null;
}

class MaxNowCustomMessageDto {
  @MaxNow({
    message: (args) => `${args.property} custom future-date error`,
  })
  value?: string;
}

describe('MaxNow', () => {
  it('accepts past dates', async () => {
    const dto = plainToInstance(MaxNowDto, {
      value: '2024-01-01T00:00:00.000Z',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('accepts null-like values', async () => {
    const dto = plainToInstance(MaxNowDto, { value: null });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects future dates', async () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const dto = plainToInstance(MaxNowDto, { value: future });
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toBeDefined();
  });

  it('rejects invalid date values', async () => {
    const dto = plainToInstance(MaxNowDto, { value: 'not-a-date' });
    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
  });

  it('uses custom default message callback when provided', async () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const dto = plainToInstance(MaxNowCustomMessageDto, { value: future });
    const errors = await validate(dto);

    expect(errors[0].constraints?.maxNow).toBe('value custom future-date error');
  });
});
