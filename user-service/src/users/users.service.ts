import { Injectable } from '@nestjs/common';
import {Prisma} from "@prisma/client";
import { DatabaseService } from 'src/database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AbilityDto } from './dto/create-ability.dto';
import { CertificateDto } from './dto/create-certificate.dto';
import { EducationDto } from './dto/create-education.dto';
import { LinkDto } from './dto/create-link.dto';
import { WorkExperienceDto } from './dto/create-work-experience.dto';
import { LanguageDto } from './dto/create-language.dto';

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
      ...userData
    } = userDto;
    
    const data: any = {...userData};
    data.auth0_id = auth0Id;
    data.phone_number = phoneNumber;

    if(abilities){
      data.abilities = {create: abilities.map((ability: AbilityDto) => ({...ability}))}
    }

    if(certificates){
      data.certificates = {create: certificates.map((certificate: CertificateDto) => ({
        ...certificate,
        certification_date: certificate.certificationDate
      }))}
    }

    if(education){
      data.education = {create: education.map((education_value: EducationDto) => ({
        ...education_value,
        school_name: education_value.schoolName,
        begin_date: new Date(education_value.beginDate),
        end_date: education_value.endDate ? new Date(education_value.endDate) : undefined,
      }))}
    }

    if(links){
      data.links = {create: links.map((link: LinkDto) => ({
        ...link,
        linkString: link.linkString
      }))}
    }

    if(workExperience){
      data.work_experiences = {create: workExperience.map((work: WorkExperienceDto) => ({
        ...work,
        company_name: work.companyName,
        begin_date: new Date(work.beginDate),
        end_date: work.endDate ? new Date(work.endDate) : undefined
      }))}
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

    if(languages && languages.length){
      data.user_languages = {
        create: languages.map((l: LanguageDto) => ({
          language: {connect: {id: l.languageId}},
          level: l.level
        }))
      }
    }

    return data;
  }

  async create(createUserDto: CreateUserDto) {
    const createUserInput = this.buildCreateData(createUserDto);

    return this.databaseService.user.create({
      data: createUserInput,
      select: {
        id: true,
        name: true,
        surname: true,
        email: true
      }
    });

  }

  async findAll() {
    return `This action returns all users`;
  }

  async findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  async update(id: number, updateUserDto: Prisma.UserUpdateInput) {
    return `This action updates a #${id} user`;
  }

  async remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
