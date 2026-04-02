import { ArgumentMetadata, ValidationPipe } from '@nestjs/common';
import { BulkAbilitiesDto } from './bulk-ability.dto';
import { BulkCertificatesDto } from './bulk-certificate.dto';
import { BulkEducationDto } from './bulk-education.dto';
import { BulkLanguagesDto } from './bulk-language.dto';
import { BulkLinksDto } from './bulk-link.dto';
import { BulkWorkExperienceDto } from './bulk-work-experience.dto';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';

const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

const validateDto = async <T>(metatype: new () => T, payload: object) =>
  pipe.transform(payload, {
    type: 'body',
    metatype,
  } as ArgumentMetadata);

describe('DTO validation', () => {
  describe('CreateUserDto', () => {
    it('accepts a valid nested payload', async () => {
      await expect(
        validateDto(CreateUserDto, {
          name: 'Jan',
          surname: 'Kowalski',
          phoneNumber: '+48600100200',
          email: 'jan@example.com',
          city: 'Gdansk',
          profileSummary:
            'Doświadczony programista backend z naciskiem na projektowanie API.',
          abilities: [{ name: 'TypeScript' }],
          links: [{ linkString: 'https://github.com/jan' }],
        }),
      ).resolves.toBeInstanceOf(CreateUserDto);
    });

    it('rejects invalid email and phone number', async () => {
      await expect(
        validateDto(CreateUserDto, {
          name: 'Jan',
          surname: 'Kowalski',
          phoneNumber: '123',
          email: 'invalid-email',
          city: 'Gdansk',
        }),
      ).rejects.toThrow();
    });

    it('rejects unknown fields because whitelist is strict', async () => {
      await expect(
        validateDto(CreateUserDto, {
          name: 'Jan',
          surname: 'Kowalski',
          phoneNumber: '+48600100200',
          email: 'jan@example.com',
          city: 'Gdansk',
          hackerField: 'nope',
        }),
      ).rejects.toThrow();
    });

    it('rejects nested invalid dates and enums', async () => {
      const future = new Date(Date.now() + 60_000).toISOString();

      await expect(
        validateDto(CreateUserDto, {
          name: 'Jan',
          surname: 'Kowalski',
          phoneNumber: '+48600100200',
          email: 'jan@example.com',
          city: 'Gdansk',
          workExperience: [
            {
              companyName: 'Acme',
              position: 'Backend Dev',
              beginDate: future,
              description: 'Budowa i utrzymanie usług backendowych.',
            },
          ],
          languages: [{ languageId: 1, level: 'Z9' }],
        }),
      ).rejects.toThrow();
    });
  });

  describe('UpdateUserDto', () => {
    it('accepts a valid partial update', async () => {
      await expect(
        validateDto(UpdateUserDto, {
          city: 'Sopot',
          profileSummary:
            'Aktualne podsumowanie zawodowe z odpowiednią długością tekstu.',
        }),
      ).resolves.toBeInstanceOf(UpdateUserDto);
    });

    it('rejects invalid phone number or too short summary', async () => {
      await expect(
        validateDto(UpdateUserDto, {
          phoneNumber: '12345',
          profileSummary: 'za krótko',
        }),
      ).rejects.toThrow();
    });
  });

  describe.each([
    [
      'BulkWorkExperienceDto',
      BulkWorkExperienceDto,
      {
        workExperiences: [
          {
            companyName: 'Acme',
            position: 'Backend Dev',
            beginDate: new Date(Date.now() + 60_000).toISOString(),
            description: 'Budowa i utrzymanie usług backendowych.',
          },
        ],
      },
    ],
    [
      'BulkEducationDto',
      BulkEducationDto,
      {
        education: [
          {
            schoolName: 'UG',
            major: 'IT',
            degree: 'X',
            beginDate: '2020-10-01T00:00:00.000Z',
          },
        ],
      },
    ],
    [
      'BulkLinksDto',
      BulkLinksDto,
      {
        links: [{ linkString: 'ftp://example.com' }],
      },
    ],
    [
      'BulkCertificatesDto',
      BulkCertificatesDto,
      {
        certificates: [
          {
            name: 'AWS Associate',
            issuer: 'Amazon',
            certificationDate: new Date(Date.now() + 60_000).toISOString(),
          },
        ],
      },
    ],
    [
      'BulkAbilitiesDto',
      BulkAbilitiesDto,
      {
        abilities: [{ name: 'JS' }],
      },
    ],
    [
      'BulkLanguagesDto',
      BulkLanguagesDto,
      {
        languages: [{ languageId: 1, level: 'INVALID' }],
      },
    ],
  ])('%s', (_label, metatype, invalidPayload) => {
    it('rejects invalid payload', async () => {
      await expect(validateDto(metatype as any, invalidPayload)).rejects.toThrow();
    });
  });
});
