import { OmitType } from "@nestjs/mapped-types";
import {IsString, IsNotEmpty, IsDateString, IsOptional, MinLength, MaxDate} from "class-validator";

// used when creating work experience from a separate request
export class CreateWorkExperienceDto{
  @IsString()
  @IsNotEmpty()
  userId: String;

  @IsString()
  @MinLength(3)
  companyName: String;

  @IsString()
  @MinLength(5)
  position: String;

  @IsDateString()
  @MaxDate(() => new Date())
  beginDate: Date;

  @IsOptional()
  @IsDateString()
  @MaxDate(() => new Date())
  endDate?: Date;

  @IsString()
  @MinLength(10)
  description: String;
}
export class WorkExperienceDto extends OmitType(CreateWorkExperienceDto, ['userId']){}
