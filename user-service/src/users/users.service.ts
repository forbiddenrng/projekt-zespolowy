import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AbilityDto } from './dto/create-ability.dto';
import { UpdateAbilityDto } from './dto/update-ability.dto';
import { CertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { EducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';
import { LinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { WorkExperienceDto } from './dto/create-work-experience.dto';
import { UpdateWorkExperienceDto } from './dto/update-work-experience.dto';
import { LanguageDto } from './dto/create-language.dto';
import { FindOneQueryParams } from 'src/ts/types';

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

    //provide create fileds EXPLICITLY
    if (certificates) {
      data.certificates = {
        create: certificates.map((certificate: CertificateDto) => ({
          name: certificate.name,
          issuer: certificate.issuer,
          certification_date: certificate.certificationDate,
        })),
      };
    }

    //provide create fileds EXPLICITLY
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

    //provide create fileds EXPLICITLY
    if (links) {
      data.links = {
        create: links.map((link: LinkDto) => ({
          linkString: link.linkString,
        })),
      };
    }

    //provide create fileds EXPLICITLY
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
      message: 'User successfuly created',
      data: newUser,
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
  //     message: "User found successfuly",
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
      message: 'User found successfuly',
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
      message: 'User successfuly deleted',
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

  async addWorkExperience(
    reqUserId: string | undefined,
    dto: WorkExperienceDto,
  ) {
    if (!reqUserId) throw new BadRequestException('User id not provided');
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const created = await this.databaseService.work_Experience.create({
      data: {
        user_id: user.id,
        company_name: dto.companyName,
        position: dto.position,
        description: dto.description,
        begin_date: new Date(dto.beginDate),
        end_date: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });

    return { statusCode: 201, message: 'Work experience added', data: created };
  }

  async updateWorkExperience(
    reqUserId: string | undefined,
    id: number,
    dto: UpdateWorkExperienceDto,
  ) {
    if (!reqUserId) throw new BadRequestException('User id not provided');
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.databaseService.work_Experience.findUnique({
      where: { id },
    });
    if (!existing || existing.user_id !== user.id)
      throw new NotFoundException('Work experience not found for this user');

    const data: any = {};
    if (dto.companyName !== undefined) data.company_name = dto.companyName;
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.beginDate !== undefined) data.begin_date = new Date(dto.beginDate);
    if (dto.endDate !== undefined)
      data.end_date = dto.endDate ? new Date(dto.endDate) : null;

    const updated = await this.databaseService.work_Experience.update({
      where: { id },
      data,
    });
    return {
      statusCode: 200,
      message: 'Work experience updated',
      data: updated,
    };
  }

  async removeWorkExperience(reqUserId: string | undefined, id: number) {
    if (!reqUserId) throw new BadRequestException('User id not provided');
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.databaseService.work_Experience.findUnique({
      where: { id },
    });
    if (!existing || existing.user_id !== user.id)
      throw new NotFoundException('Work experience not found for this user');

    const deleted = await this.databaseService.work_Experience.delete({
      where: { id },
    });
    return {
      statusCode: 200,
      message: 'Work experience deleted',
      data: deleted,
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

  async addEducation(reqUserId: string | undefined, dto: EducationDto) {
    if (!reqUserId) throw new BadRequestException('User id not provided');
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const created = await this.databaseService.education.create({
      data: {
        user_id: user.id,
        school_name: dto.schoolName,
        major: dto.major,
        degree: dto.degree,
        begin_date: new Date(dto.beginDate),
        end_date: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });

    return { statusCode: 201, message: 'Education added', data: created };
  }

  async updateEducation(
    reqUserId: string | undefined,
    id: number,
    dto: UpdateEducationDto,
  ) {
    if (!reqUserId) throw new BadRequestException('User id not provided');
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.databaseService.education.findUnique({
      where: { id },
    });
    if (!existing || existing.user_id !== user.id)
      throw new NotFoundException('Education record not found for this user');

    const data: any = {};
    if (dto.schoolName !== undefined) data.school_name = dto.schoolName;
    if (dto.major !== undefined) data.major = dto.major;
    if (dto.degree !== undefined) data.degree = dto.degree;
    if (dto.beginDate !== undefined) data.begin_date = new Date(dto.beginDate);
    if (dto.endDate !== undefined)
      data.end_date = dto.endDate ? new Date(dto.endDate) : null;

    const updated = await this.databaseService.education.update({
      where: { id },
      data,
    });

    return { statusCode: 200, message: 'Education updated', data: updated };
  }

  async removeEducation(reqUserId: string | undefined, id: number) {
    if (!reqUserId) throw new BadRequestException('User id not provided');
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.databaseService.education.findUnique({
      where: { id },
    });
    if (!existing || existing.user_id !== user.id)
      throw new NotFoundException('Education record not found for this user');

    const deleted = await this.databaseService.education.delete({
      where: { id },
    });

    return { statusCode: 200, message: 'Education deleted', data: deleted };
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

  async addLink(reqUserId: string | undefined, dto: LinkDto) {
    if (!reqUserId) throw new BadRequestException('User id not provided');
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const created = await this.databaseService.link.create({
      data: {
        user_id: user.id,
        linkString: dto.linkString,
      },
    });

    return { statusCode: 201, message: 'Link added', data: created };
  }

  async updateLink(
    reqUserId: string | undefined,
    id: number,
    dto: UpdateLinkDto,
  ) {
    if (!reqUserId) throw new BadRequestException('User id not provided');
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.databaseService.link.findUnique({
      where: { id },
    });
    if (!existing || existing.user_id !== user.id)
      throw new NotFoundException('Link record not found for this user');

    const data: any = {};
    if (dto.linkString !== undefined) data.linkString = dto.linkString;

    const updated = await this.databaseService.link.update({
      where: { id },
      data,
    });

    return { statusCode: 200, message: 'Link updated', data: updated };
  }

  async removeLink(reqUserId: string | undefined, id: number) {
    if (!reqUserId) throw new BadRequestException('User id not provided');
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.databaseService.link.findUnique({
      where: { id },
    });
    if (!existing || existing.user_id !== user.id)
      throw new NotFoundException('Link record not found for this user');

    const deleted = await this.databaseService.link.delete({
      where: { id },
    });

    return { statusCode: 200, message: 'Link deleted', data: deleted };
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

  async addCertificate(reqUserId: string | undefined, dto: CertificateDto) {
    if (!reqUserId) throw new BadRequestException('User id not provided');
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });

    if (!user) throw new NotFoundException('User not found');
    const data: any = {
      user_id: user.id,
      name: dto.name,
      issuer: dto.issuer,
    };

    if (dto.certificationDate) {
      data.certification_date = new Date(dto.certificationDate);
    }

    const created = await this.databaseService.certificate.create({ data });
    return { statusCode: 201, message: 'Certificate added', data: created };
  }

  async updateCertificate(
    reqUserId: string | undefined,
    id: number,
    dto: UpdateCertificateDto,
  ) {
    if (!reqUserId) throw new BadRequestException('User id not provided');
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.databaseService.certificate.findUnique({
      where: { id },
    });
    if (!existing || existing.user_id !== user.id)
      throw new NotFoundException('Certificate record not found for this user');

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.issuer !== undefined) data.issuer = dto.issuer;
    if (dto.certificationDate !== undefined)
      data.certification_date = dto.certificationDate
        ? new Date(dto.certificationDate)
        : null;

    const updated = await this.databaseService.certificate.update({
      where: { id },
      data,
    });

    return { statusCode: 200, message: 'Certificate updated', data: updated };
  }

  async removeCertificate(reqUserId: string | undefined, id: number) {
    if (!reqUserId) throw new BadRequestException('User id not provided');
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.databaseService.certificate.findUnique({
      where: { id },
    });
    if (!existing || existing.user_id !== user.id)
      throw new NotFoundException('Certificate record not found for this user');

    const deleted = await this.databaseService.certificate.delete({
      where: { id },
    });

    return { statusCode: 200, message: 'Certificate deleted', data: deleted };
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

  async addAbility(reqUserId: string | undefined, dto: AbilityDto) {
    if (!reqUserId) throw new BadRequestException('User id not provided');
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const created = await this.databaseService.abilities.create({
      data: {
        user_id: user.id,
        name: dto.name,
      },
    });

    return { statusCode: 201, message: 'Ability added', data: created };
  }

  async updateAbility(
    reqUserId: string | undefined,
    id: number,
    dto: UpdateAbilityDto,
  ) {
    if (!reqUserId) throw new BadRequestException('User id not provided');
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.databaseService.abilities.findUnique({
      where: { id },
    });
    if (!existing || existing.user_id !== user.id)
      throw new NotFoundException('Ability record not found for this user');

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;

    const updated = await this.databaseService.abilities.update({
      where: { id },
      data,
    });

    return { statusCode: 200, message: 'Ability updated', data: updated };
  }

  async removeAbility(reqUserId: string | undefined, id: number) {
    if (!reqUserId) throw new BadRequestException('User id not provided');
    const user = await this.databaseService.user.findUnique({
      where: { auth0_id: reqUserId },
    });
    if (!user) throw new NotFoundException('User not found');

    const existing = await this.databaseService.abilities.findUnique({
      where: { id },
    });
    if (!existing || existing.user_id !== user.id)
      throw new NotFoundException('Ability record not found for this user');

    const deleted = await this.databaseService.abilities.delete({
      where: { id },
    });

    return { statusCode: 200, message: 'Ability deleted', data: deleted };
  }
}
