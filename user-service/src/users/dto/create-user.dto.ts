import {IsString, IsOptional, IsArray, ValidateNested, IsEmail, IsNotEmpty, MinLength, IsPhoneNumber, IsInt} from "class-validator";
import {Type} from 'class-transformer';
import { LinkDto } from "./create-link.dto";
import { EducationDto } from "./create-education.dto";
import { CertificateDto } from "./create-certificate.dto";
import { AbilityDto } from "./create-ability.dto";
import { WorkExperienceDto } from "./create-work-experience.dto";
import { LanguageDto } from "./create-language.dto";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  auth0Id: String;

  @IsString()
  @IsNotEmpty()
  name: String;

  @IsString()
  @IsNotEmpty()
  surname: String;

  @IsString()
  @IsPhoneNumber('PL')
  phoneNumber: String;

  @IsEmail()
  email: String;

  @IsString()
  @IsNotEmpty()
  city: String;

  @IsOptional()
  @IsString()
  @MinLength(20)
  profileSummary?: String;

  @IsOptional()
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => LinkDto)
  links?: LinkDto[];


  @IsOptional()
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => EducationDto)
  education?: EducationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => CertificateDto)
  certificates?: CertificateDto[];


  @IsOptional()
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => AbilityDto)
  abilities?: AbilityDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => WorkExperienceDto)
  workExperience?: WorkExperienceDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => LanguageDto)
  languages?: LanguageDto[];

}