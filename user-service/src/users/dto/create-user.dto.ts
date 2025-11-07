import {IsString, IsOptional, IsArray, ValidateNested, IsEmail, IsNotEmpty} from "class-validator";
import {Type} from 'class-transformer';
import { CreateLinkDto } from "./create-link.dto";
import { CreateEducationDto } from "./create-education.dto";

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
  @IsNotEmpty()
  phoneNumber: String;

  @IsEmail()
  email: String;

  @IsString()
  @IsNotEmpty()
  city: String;

  @IsOptional()
  @IsString()
  profileSummary?: String;

  @IsOptional()
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => CreateLinkDto)
  links?: CreateLinkDto[];


  @IsOptional()
  @IsArray()
  @Type(() => CreateEducationDto)
  education?: CreateEducationDto[];

}