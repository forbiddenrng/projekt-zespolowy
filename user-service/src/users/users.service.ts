import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import {Prisma} from "@prisma/client";
import { DatabaseService } from 'src/database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AbilityDto } from './dto/create-ability.dto';
import { CertificateDto } from './dto/create-certificate.dto';
import { EducationDto } from './dto/create-education.dto';
import { LinkDto } from './dto/create-link.dto';
import { WorkExperienceDto } from './dto/create-work-experience.dto';
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
      ...userData
    } = userDto;
    
    const data: any = {...userData};
    data.auth0_id = auth0Id;
    data.phone_number = phoneNumber;

    if(abilities){
      data.abilities = {create: abilities.map((ability: AbilityDto) => ({...ability}))}
    }

    //provide create fileds EXPLICITLY
    if(certificates){
      data.certificates = {create: certificates.map((certificate: CertificateDto) => ({
        name: certificate.name,
        issuer: certificate.issuer,
        certification_date: certificate.certificationDate
      }))}
    }

    //provide create fileds EXPLICITLY
    if(education){
      data.education = {create: education.map((education_value: EducationDto) => ({
        school_name: education_value.schoolName,
        major: education_value.major,
        degree: education_value.degree,
        begin_date: new Date(education_value.beginDate),
        end_date: education_value.endDate ? new Date(education_value.endDate) : undefined,
      }))}
    }

    //provide create fileds EXPLICITLY
    if(links){
      data.links = {create: links.map((link: LinkDto) => ({
        linkString: link.linkString,
      }))}
    }

    //provide create fileds EXPLICITLY
    if(workExperience){
      data.work_experiences = {create: workExperience.map((work: WorkExperienceDto) => ({
        position: work.position,
        description: work.description,
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

  private buildFindOneQuery(params: FindOneQueryParams) {
    const {
      abilities,
      certificates,
      education,
      languages,
      links,
      work,
      all
    } = params;

    const findQuery: any = {
      id: true,
      auth0_id: true,
      name: true,
      surname: true
    };

    if (abilities === "true" || all==="true"){
      findQuery.abilities = {
        omit: {
          user_id: true,
        }
      }
    }

    if (certificates === "true" || all==="true"){
      findQuery.certificates = {
        omit: {
          user_id: true
        }
      }
    }

    if (education === "true" || all==="true"){
      findQuery.education = {
        omit: {
          user_id: true
        }
      }
    }

    if (links === "true" || all==="true"){
      findQuery.links = {
        omit: {
          user_id: true
        }
      }
    }

    if (work === "true" || all==="true"){
      findQuery.work_experiences = {
        omit: {
          user_id: true
        }
      }
    }
    if (languages === "true" || all==="true"){
      findQuery.user_languages = {
        select: {
          language: true
        }
      }
    }

    return findQuery;

  }

  async create(createUserDto: CreateUserDto) {
    const createUserInput = this.buildCreateData(createUserDto);

    const {auth0_id, email, phone_number} = createUserInput;

    const user = await this.databaseService.user.findFirst({where: {
      OR: [
        {auth0_id: auth0_id},
        {email: email},
        {phone_number: phone_number}
      ]
    }});

    if(user){
      throw new BadRequestException('Cannot create user', {
        description: "User with this id/email/phone number already exist"
      });
    }
    // console.dir(createUserInput, {depth: null});
    const newUser = await this.databaseService.user.create({
      data: createUserInput,
      select: {
        id: true,
        name: true,
        surname: true,
        email: true
      }
    });

    return {
      statusCode: 201,
      message: "User successfuly created",
      data: newUser
    }

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

    const user = await this.databaseService.user.findUnique({where: {auth0_id: id}, select: findQuery});


    if(!user){
      throw new NotFoundException('Record not found', {
        description: `User with id ${id} not found.`
      });
    }
    return {
      statusCode: 200,
      message: "User found successfuly",
      data: user
    }
  }

  async update(id: number, updateUserDto: Prisma.UserUpdateInput) {
    return `This action updates a #${id} user`;
  }

  async remove(id: string) {
    const deletedUser = await this.databaseService.user.delete({where: {auth0_id: id}});

    if(!deletedUser){
      throw new NotFoundException('Cannot delete user', {
        description: `User with id ${id} does not exist`
      });
    }
    return {
      statusCode: 200,
      message: "User successfuly deleted",
      data: deletedUser
    }
  }
}
