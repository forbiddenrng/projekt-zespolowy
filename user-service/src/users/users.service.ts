import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { FindOneQueryParams } from 'src/ts/types';
import { CreateUserDto } from './dto/create-user.dto';
import { LinkDto } from './dto/create-link.dto';
import { EducationDto } from './dto/create-education.dto';
import { CertificateDto } from './dto/create-certificate.dto';
import { AbilityDto } from './dto/create-ability.dto';
import { WorkExperienceDto } from './dto/create-work-experience.dto';
import { LanguageDto } from './dto/create-language.dto';
import { BulkEducationDto } from './dto/bulk-education.dto';
import { BulkWorkExperienceDto } from './dto/bulk-work-experience.dto';
import { BulkCertificatesDto } from './dto/bulk-certificate.dto';
import { BulkLanguagesDto } from './dto/bulk-language.dto';
import { BulkLinksDto } from './dto/bulk-link.dto';
import { BulkAbilitiesDto } from './dto/bulk-ability.dto';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  private buildCreateData(userDto: CreateUserDto): Prisma.UserCreateInput {
    const {
      abilities,
      certificates,
      education,
      links,
      languages,
      workExperience,
      auth0Id,
      phoneNumber,
      profileSummary,
      ...userData
    } = userDto;

    const data: any = { ...userData };
    data.auth0_id = auth0Id;
    data.phone_number = phoneNumber;
    data.profile_summary = profileSummary;

    if (abilities) {
      data.abilities = {
        create: abilities.map((ability: AbilityDto) => ({ ...ability })),
      };
    }

    //provide create fields EXPLICITLY
    if (certificates) {
      data.certificates = {
        create: certificates.map((certificate: CertificateDto) => ({
          name: certificate.name,
          issuer: certificate.issuer,
          certification_date: certificate.certificationDate,
        })),
      };
    }

    //provide create fields EXPLICITLY
    if (education) {
      data.education = {
        create: education.map((education_value: EducationDto) => ({
          school_name: education_value.schoolName,
          major: education_value.major,
          degree: education_value.degree,
          begin_date: new Date(education_value.beginDate),
          end_date: education_value.endDate
            ? new Date(education_value.endDate)
            : undefined,
        })),
      };
    }

    //provide create fields EXPLICITLY
    if (links) {
      data.links = {
        create: links.map((link: LinkDto) => ({
          linkString: link.linkString,
        })),
      };
    }

    //provide create fields EXPLICITLY
    if (workExperience) {
      data.work_experiences = {
        create: workExperience.map((work: WorkExperienceDto) => ({
          position: work.position,
          description: work.description,
          company_name: work.companyName,
          begin_date: new Date(work.beginDate),
          end_date: work.endDate ? new Date(work.endDate) : undefined,
        })),
      };
    }

    /*
      data.user_languages = {
        create: [
          {
            language: {
              connect: {
                id: 1,
              }
            },
            level: A1 
          },
          ...
        ]
      }

    */

    if (languages && languages.length) {
      data.user_languages = {
        create: languages.map((l: LanguageDto) => ({
          language: { connect: { id: l.languageId } },
          level: l.level,
        })),
      };
    }

    return data;
  }

  private buildFindOneQuery(params: FindOneQueryParams) {
    const { abilities, certificates, education, languages, links, work, all } =
      params;

    const findQuery: any = {
      id: true,
      auth0_id: true,
      name: true,
      surname: true,
      phone_number: true,
      email: true,
      city: true,
      profile_summary: true,
    };

    if (abilities === 'true' || all === 'true') {
      findQuery.abilities = {
        omit: {
          user_id: true,
        },
      };
    }

    if (certificates === 'true' || all === 'true') {
      findQuery.certificates = {
        omit: {
          user_id: true,
        },
      };
    }

    if (education === 'true' || all === 'true') {
      findQuery.education = {
        omit: {
          user_id: true,
        },
      };
    }

    if (links === 'true' || all === 'true') {
      findQuery.links = {
        omit: {
          user_id: true,
        },
      };
    }

    if (work === 'true' || all === 'true') {
      findQuery.work_experiences = {
        omit: {
          user_id: true,
        },
      };
    }
    if (languages === 'true' || all === 'true') {
      findQuery.user_languages = {
        select: {
          language: true,
        },
      };
    }

    return findQuery;
  }

  async create(createUserDto: CreateUserDto) {
    const createUserInput = this.buildCreateData(createUserDto);

    const { auth0_id, email, phone_number } = createUserInput;

    const user = await this.databaseService.user.findFirst({
      where: {
        OR: [
          { auth0_id: auth0_id },
          { email: email },
          { phone_number: phone_number },
        ],
      },
    });

    if (user) {
      throw new BadRequestException('Cannot create user', {
        description: 'User with this id/email/phone number already exist',
      });
    }
    // console.dir(createUserInput, {depth: null});
    const newUser = await this.databaseService.user.create({
      data: createUserInput,
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
      },
    });

    return {
      statusCode: 201,
      message: 'User successfully created',
      data: newUser,
    };
  }

  // check if profile exists for current user (req.userId parsed from x-user)
  async profileExistsForCurrentUser(reqUserId: string | undefined) {
    if (!reqUserId) throw new BadRequestException('User id not provided');
    return this.profileExistsByAuth0Id(reqUserId);
  }

  // public check by auth0Id used by other services
  async profileExistsByAuth0Id(auth0Id: string) {
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: auth0Id },
      select: { id: true }, // minimal select
    });

    return {
      statusCode: 200,
      message: user ? 'User exists' : 'User not found',
      data: { exists: !!user },
    };
  }

  // async findOneAbilities(id: string){
  //   const user = await this.databaseService.user.findUnique({where: {auth0_id: id},
  //   select: {
  //     user_languages: {
  //       select: {
  //         language: true
  //       }
  //     }
  //   }
  //   })

  //   return {
  //     statusCode: 200,
  //     message: "User found successfully",
  //     data: user
  //   }
  // }

  async findOne(id: string, params: FindOneQueryParams) {
    const findQuery = this.buildFindOneQuery(params);

    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: id },
      select: findQuery,
    });

    if (!user) {
      throw new NotFoundException('Record not found', {
        description: `User with id ${id} not found.`,
      });
    }
    return {
      statusCode: 200,
      message: 'User found successfully',
      data: user,
    };
  }

  async update(id: number, updateUserDto: Prisma.UserUpdateInput) {
    return `This action updates a #${id} user`;
  }

  async remove(id: string) {
    const deletedUser = await this.databaseService.user.delete({
      where: { auth0_id: id },
    });

    if (!deletedUser) {
      throw new NotFoundException('Cannot delete user', {
        description: `User with id ${id} does not exist`,
      });
    }
    return {
      statusCode: 200,
      message: 'User successfully deleted',
      data: deletedUser,
    };
  }

  // -------------------------------------------
  // ----- Work Experience related methods -----
  // -------------------------------------------

  // list experiences for current user (req.userId parsed from x-user)
  async listWorkExperiencesForCurrentUser(reqUserId: string | undefined) {
    if (!reqUserId) throw new BadRequestException('User id not provided');
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const items = await this.databaseService.work_Experience.findMany({
      where: { user_id: user.id },
      orderBy: { begin_date: 'desc' },
    });

    return {
      statusCode: 200,
      message: 'Work experiences fetched',
      data: items,
    };
  }

  // list experiences by auth0Id (public for other services)
  async listWorkExperiencesByAuth0Id(auth0Id: string) {
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: auth0Id },
    });
    if (!user) {
      throw new NotFoundException('User not found', {
        description: `User with id ${auth0Id} not found.`,
      });
    }

    const items = await this.databaseService.work_Experience.findMany({
      where: { user_id: user.id },
      orderBy: { begin_date: 'desc' },
    });

    return {
      statusCode: 200,
      message: 'Work experiences fetched',
      data: items,
    };
  }

  // merge work experience records for current user
  async mergeWorkExperiences(
    reqUserId: string | undefined,
    dto: BulkWorkExperienceDto,
  ) {
    if (!reqUserId) throw new BadRequestException('User id not provided');

    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const workExpList = dto.workExperiences || [];

    const existing = await this.databaseService.work_Experience.findMany({
      where: { user_id: user.id },
    });

    const existingIds = existing.map((e) => e.id);
    const providedIds = workExpList
      .filter((item) => item.id !== undefined)
      .map((item) => item.id);

    const idsToDelete = existingIds.filter((id) => !providedIds.includes(id));

    const result = await this.databaseService.$transaction(async (prisma) => {
      if (idsToDelete.length > 0) {
        await prisma.work_Experience.deleteMany({
          where: {
            id: { in: idsToDelete },
            user_id: user.id,
          },
        });
      }

      const operations = workExpList.map((item) => {
        if (item.id) {
          const existingRecord = existing.find((e) => e.id === item.id);
          if (!existingRecord) {
            throw new NotFoundException(
              `Work experience record with id ${item.id} not found for this user`,
            );
          }

          return prisma.work_Experience.update({
            where: { id: item.id },
            data: {
              company_name: item.companyName,
              position: item.position,
              description: item.description,
              begin_date: new Date(item.beginDate),
              end_date: item.endDate ? new Date(item.endDate) : null,
            },
          });
        } else {
          return prisma.work_Experience.create({
            data: {
              user_id: user.id,
              company_name: item.companyName,
              position: item.position,
              description: item.description,
              begin_date: new Date(item.beginDate),
              end_date: item.endDate ? new Date(item.endDate) : undefined,
            },
          });
        }
      });

      return Promise.all(operations);
    });

    return {
      statusCode: 200,
      message: 'Work experiences synchronized',
      data: result,
      metadata: {
        created: result.filter((r) => !existingIds.includes(r.id)).length,
        updated: result.filter((r) => existingIds.includes(r.id)).length,
        deleted: idsToDelete.length,
      },
    };
  }

  // -------------------------------------
  // ----- Education related methods -----
  // -------------------------------------

  // list education for current user (req.userId parsed from x-user)
  async listEducationForCurrentUser(reqUserId: string | undefined) {
    if (!reqUserId) throw new BadRequestException('User id not provided');
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const items = await this.databaseService.education.findMany({
      where: { user_id: user.id },
      orderBy: { begin_date: 'desc' },
    });

    return {
      statusCode: 200,
      message: 'Education items fetched',
      data: items,
    };
  }

  // list education by auth0Id (public for other services)
  async listEducationByAuth0Id(auth0Id: string) {
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: auth0Id },
    });
    if (!user) {
      throw new NotFoundException('User not found', {
        description: `User with id ${auth0Id} not found.`,
      });
    }

    const items = await this.databaseService.education.findMany({
      where: { user_id: user.id },
      orderBy: { begin_date: 'desc' },
    });

    return {
      statusCode: 200,
      message: 'Education items fetched',
      data: items,
    };
  }

  /*
   * merge education records for current user
   * - items with id: UPDATE
   * - items without id: CREATE
   * - items not in list: DELETE
   */
  async mergeEducation(reqUserId: string | undefined, dto: BulkEducationDto) {
    if (!reqUserId) throw new BadRequestException('User id not provided');

    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const educationList = dto.education || [];

    const existing = await this.databaseService.education.findMany({
      where: { user_id: user.id },
    });

    const existingIds = existing.map((e) => e.id);
    const providedIds = educationList
      .filter((item) => item.id !== undefined)
      .map((item) => item.id);

    const idsToDelete = existingIds.filter((id) => !providedIds.includes(id));

    const result = await this.databaseService.$transaction(async (prisma) => {
      // 1. DELETE records not in the list
      if (idsToDelete.length > 0) {
        await prisma.education.deleteMany({
          where: {
            id: { in: idsToDelete },
            user_id: user.id,
          },
        });
      }

      // 2. CREATE or UPDATE records
      const operations = educationList.map((item) => {
        if (item.id) {
          // verify ownership
          const existingRecord = existing.find((e) => e.id === item.id);
          if (!existingRecord) {
            throw new NotFoundException(
              `Education record with id ${item.id} not found for this user`,
            );
          }

          // UPDATE
          return prisma.education.update({
            where: { id: item.id },
            data: {
              school_name: item.schoolName,
              major: item.major,
              degree: item.degree,
              begin_date: new Date(item.beginDate),
              end_date: item.endDate ? new Date(item.endDate) : null,
            },
          });
        } else {
          // CREATE
          return prisma.education.create({
            data: {
              user_id: user.id,
              school_name: item.schoolName,
              major: item.major,
              degree: item.degree,
              begin_date: new Date(item.beginDate),
              end_date: item.endDate ? new Date(item.endDate) : undefined,
            },
          });
        }
      });

      return Promise.all(operations);
    });

    return {
      statusCode: 200,
      message: 'Education records synchronized',
      data: result,
      metadata: {
        created: result.filter((r) => !existingIds.includes(r.id)).length,
        updated: result.filter((r) => existingIds.includes(r.id)).length,
        deleted: idsToDelete.length,
      },
    };
  }

  // ---------------------------------
  // ----- Links related methods -----
  // ---------------------------------

  // list links for current user (req.userId parsed from x-user)
  async listLinksForCurrentUser(reqUserId: string | undefined) {
    if (!reqUserId) throw new BadRequestException('User id not provided');
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const items = await this.databaseService.link.findMany({
      where: { user_id: user.id },
      orderBy: { id: 'desc' },
    });

    return {
      statusCode: 200,
      message: 'Links fetched',
      data: items,
    };
  }

  // list links by auth0Id (public for other services)
  async listLinksByAuth0Id(auth0Id: string) {
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: auth0Id },
    });
    if (!user) {
      throw new NotFoundException('User not found', {
        description: `User with id ${auth0Id} not found.`,
      });
    }

    const items = await this.databaseService.link.findMany({
      where: { user_id: user.id },
      orderBy: { id: 'desc' },
    });

    return {
      statusCode: 200,
      message: 'Links fetched',
      data: items,
    };
  }

  // merge links for current user
  async mergeLinks(reqUserId: string | undefined, dto: BulkLinksDto) {
    if (!reqUserId) throw new BadRequestException('User id not provided');

    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const linksList = dto.links || [];

    const existing = await this.databaseService.link.findMany({
      where: { user_id: user.id },
    });

    const existingIds = existing.map((e) => e.id);
    const providedIds = linksList
      .filter((item) => item.id !== undefined)
      .map((item) => item.id);

    const idsToDelete = existingIds.filter((id) => !providedIds.includes(id));

    const result = await this.databaseService.$transaction(async (prisma) => {
      if (idsToDelete.length > 0) {
        await prisma.link.deleteMany({
          where: {
            id: { in: idsToDelete },
            user_id: user.id,
          },
        });
      }

      const operations = linksList.map((item) => {
        if (item.id) {
          const existingRecord = existing.find((e) => e.id === item.id);
          if (!existingRecord) {
            throw new NotFoundException(
              `Link record with id ${item.id} not found for this user`,
            );
          }

          return prisma.link.update({
            where: { id: item.id },
            data: {
              linkString: item.linkString,
            },
          });
        } else {
          return prisma.link.create({
            data: {
              user_id: user.id,
              linkString: item.linkString,
            },
          });
        }
      });

      return Promise.all(operations);
    });

    return {
      statusCode: 200,
      message: 'Links synchronized',
      data: result,
      metadata: {
        created: result.filter((r) => !existingIds.includes(r.id)).length,
        updated: result.filter((r) => existingIds.includes(r.id)).length,
        deleted: idsToDelete.length,
      },
    };
  }

  // ----------------------------------------
  // ----- Certificates related methods -----
  // ----------------------------------------

  // list certificates for current user (req.userId parsed from x-user)
  async listCertificatesForCurrentUser(reqUserId: string | undefined) {
    if (!reqUserId) throw new BadRequestException('User id not provided');
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const items = await this.databaseService.certificate.findMany({
      where: { user_id: user.id },
      orderBy: { certification_date: 'desc' },
    });

    return {
      statusCode: 200,
      message: 'Certificates fetched',
      data: items,
    };
  }

  // list certificates by auth0Id (public for other services)
  async listCertificatesByAuth0Id(auth0Id: string) {
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: auth0Id },
    });
    if (!user) {
      throw new NotFoundException('User not found', {
        description: `User with id ${auth0Id} not found.`,
      });
    }

    const items = await this.databaseService.certificate.findMany({
      where: { user_id: user.id },
      orderBy: { certification_date: 'desc' },
    });

    return {
      statusCode: 200,
      message: 'Certificates fetched',
      data: items,
    };
  }

  // merge certificates for current user
  async mergeCertificates(
    reqUserId: string | undefined,
    dto: BulkCertificatesDto,
  ) {
    if (!reqUserId) throw new BadRequestException('User id not provided');

    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const certificatesList = dto.certificates || [];

    const existing = await this.databaseService.certificate.findMany({
      where: { user_id: user.id },
    });

    const existingIds = existing.map((e) => e.id);
    const providedIds = certificatesList
      .filter((item) => item.id !== undefined)
      .map((item) => item.id);

    const idsToDelete = existingIds.filter((id) => !providedIds.includes(id));

    const result = await this.databaseService.$transaction(async (prisma) => {
      if (idsToDelete.length > 0) {
        await prisma.certificate.deleteMany({
          where: {
            id: { in: idsToDelete },
            user_id: user.id,
          },
        });
      }

      const operations = certificatesList.map((item) => {
        if (item.id) {
          const existingRecord = existing.find((e) => e.id === item.id);
          if (!existingRecord) {
            throw new NotFoundException(
              `Certificate record with id ${item.id} not found for this user`,
            );
          }

          return prisma.certificate.update({
            where: { id: item.id },
            data: {
              name: item.name,
              issuer: item.issuer,
              certification_date: new Date(item.certificationDate),
            },
          });
        } else {
          return prisma.certificate.create({
            data: {
              user_id: user.id,
              name: item.name,
              issuer: item.issuer,
              certification_date: new Date(item.certificationDate),
            },
          });
        }
      });

      return Promise.all(operations);
    });

    return {
      statusCode: 200,
      message: 'Certificates synchronized',
      data: result,
      metadata: {
        created: result.filter((r) => !existingIds.includes(r.id)).length,
        updated: result.filter((r) => existingIds.includes(r.id)).length,
        deleted: idsToDelete.length,
      },
    };
  }

  // --------------------------------------
  // ----- Abilities (skills) methods -----
  // --------------------------------------

  // list abilities for current user (req.userId parsed from x-user)
  async listAbilitiesForCurrentUser(reqUserId: string | undefined) {
    if (!reqUserId) throw new BadRequestException('User id not provided');
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const items = await this.databaseService.abilities.findMany({
      where: { user_id: user.id },
      orderBy: { id: 'desc' },
    });

    return {
      statusCode: 200,
      message: 'Abilities fetched',
      data: items,
    };
  }

  // list abilities by auth0Id (public for other services)
  async listAbilitiesByAuth0Id(auth0Id: string) {
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: auth0Id },
    });
    if (!user) {
      throw new NotFoundException('User not found', {
        description: `User with id ${auth0Id} not found.`,
      });
    }

    const items = await this.databaseService.abilities.findMany({
      where: { user_id: user.id },
      orderBy: { id: 'desc' },
    });

    return {
      statusCode: 200,
      message: 'Abilities fetched',
      data: items,
    };
  }

  // merge abilities for current user
  async mergeAbilities(reqUserId: string | undefined, dto: BulkAbilitiesDto) {
    if (!reqUserId) throw new BadRequestException('User id not provided');

    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const abilitiesList = dto.abilities || [];

    const existing = await this.databaseService.abilities.findMany({
      where: { user_id: user.id },
    });

    const existingIds = existing.map((e) => e.id);
    const providedIds = abilitiesList
      .filter((item) => item.id !== undefined)
      .map((item) => item.id);

    const idsToDelete = existingIds.filter((id) => !providedIds.includes(id));

    const result = await this.databaseService.$transaction(async (prisma) => {
      if (idsToDelete.length > 0) {
        await prisma.abilities.deleteMany({
          where: {
            id: { in: idsToDelete },
            user_id: user.id,
          },
        });
      }

      const operations = abilitiesList.map((item) => {
        if (item.id) {
          const existingRecord = existing.find((e) => e.id === item.id);
          if (!existingRecord) {
            throw new NotFoundException(
              `Ability record with id ${item.id} not found for this user`,
            );
          }

          return prisma.abilities.update({
            where: { id: item.id },
            data: {
              name: item.name,
            },
          });
        } else {
          return prisma.abilities.create({
            data: {
              user_id: user.id,
              name: item.name,
            },
          });
        }
      });

      return Promise.all(operations);
    });

    return {
      statusCode: 200,
      message: 'Abilities synchronized',
      data: result,
      metadata: {
        created: result.filter((r) => !existingIds.includes(r.id)).length,
        updated: result.filter((r) => existingIds.includes(r.id)).length,
        deleted: idsToDelete.length,
      },
    };
  }

  // ------------------------------------------------------
  // ----- Languages (user_languages) related methods -----
  // ------------------------------------------------------

  // get all languages
  async getAllLanguages() {
    const languages = await this.databaseService.languages.findMany({
      orderBy: { name: 'asc' },
    });

    return {
      statusCode: 200,
      message: 'Languages fetched',
      data: languages,
    };
  }

  // list languages for current user (req.userId parsed from x-user)
  async listLanguagesForCurrentUser(reqUserId: string | undefined) {
    if (!reqUserId) throw new BadRequestException('User id not provided');

    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const items = await this.databaseService.user_Languages.findMany({
      where: { user_id: user.id },
      orderBy: { id: 'desc' },
      include: { language: true },
    });

    return {
      statusCode: 200,
      message: 'Languages fetched',
      data: items,
    };
  }

  // list languages by auth0Id (public for other services)
  async listLanguagesByAuth0Id(auth0Id: string) {
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: auth0Id },
    });
    if (!user) {
      throw new NotFoundException('User not found', {
        description: `User with id ${auth0Id} not found.`,
      });
    }

    const items = await this.databaseService.user_Languages.findMany({
      where: { user_id: user.id },
      orderBy: { id: 'desc' },
      include: { language: true },
    });

    return {
      statusCode: 200,
      message: 'Languages fetched',
      data: items,
    };
  }

  // merge languages for current user
  // languages is a many-to-many relationship (user_languages table)
  async mergeLanguages(reqUserId: string | undefined, dto: BulkLanguagesDto) {
    if (!reqUserId) throw new BadRequestException('User id not provided');

    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const languagesList = dto.languages || [];

    // pre-validate duplicates in payload
    const seen = new Set<number>();
    for (const item of languagesList) {
      if (seen.has(item.languageId)) {
        throw new BadRequestException(
          `Language ${item.languageId} is provided more than once in payload`,
        );
      }
      seen.add(item.languageId);
    }

    // batch-fetch languages and validate existence
    const uniqueLangIds = [...seen];
    const validLanguages = await this.databaseService.languages.findMany({
      where: { id: { in: uniqueLangIds } },
    });
    const validLangIds = new Set(validLanguages.map((l) => l.id));
    for (const item of languagesList) {
      if (!validLangIds.has(item.languageId)) {
        throw new NotFoundException(
          `Language with id ${item.languageId} not found`,
        );
      }
    }

    const existing = await this.databaseService.user_Languages.findMany({
      where: { user_id: user.id },
      include: { language: true },
    });

    const existingIds = existing.map((e) => e.id);
    const providedIds = languagesList
      .filter((item) => item.id !== undefined)
      .map((item) => item.id);

    const idsToDelete = existingIds.filter((id) => !providedIds.includes(id));

    const result = await this.databaseService.$transaction(async (prisma) => {
      if (idsToDelete.length > 0) {
        await prisma.user_Languages.deleteMany({
          where: { id: { in: idsToDelete }, user_id: user.id },
        });
      }

      const out: typeof existing = [];
      for (const item of languagesList) {
        if (item.id) {
          const duplicateLanguage = await prisma.user_Languages.findFirst({
            where: {
              user_id: user.id,
              language_id: item.languageId,
              id: { not: item.id },
            },
          });
          if (duplicateLanguage) {
            throw new BadRequestException(
              `Language ${item.languageId} is already added for this user`,
            );
          }

          out.push(
            await prisma.user_Languages.update({
              where: { id: item.id },
              data: { language_id: item.languageId, level: item.level },
              include: { language: true },
            }),
          );
        } else {
          const duplicateLanguage = await prisma.user_Languages.findFirst({
            where: {
              user_id: user.id,
              language_id: item.languageId,
            },
          });
          if (duplicateLanguage) {
            throw new BadRequestException(
              `Language ${item.languageId} is already added for this user`,
            );
          }

          out.push(
            await prisma.user_Languages.create({
              data: {
                user_id: user.id,
                language_id: item.languageId,
                level: item.level,
              },
              include: { language: true },
            }),
          );
        }
      }

      return out;
    });

    return {
      statusCode: 200,
      message: 'Languages synchronized',
      data: result,
      metadata: {
        created: result.filter((r) => !existingIds.includes(r.id)).length,
        updated: result.filter((r) => existingIds.includes(r.id)).length,
        deleted: idsToDelete.length,
      },
    };
  }
}
