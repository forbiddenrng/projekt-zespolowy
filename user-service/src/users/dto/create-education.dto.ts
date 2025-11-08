import {IsString, IsNotEmpty, IsDateString, IsOptional, MinLength, MaxDate} from "class-validator";
import { OmitType } from "@nestjs/mapped-types";

// used when creating education from a separate request
export class CreateEducationDto {
  @IsString()
  @IsNotEmpty()
  userId: String;

  @IsString()
  @MinLength(3)
  schoolName: String;

  @IsString()
  @MinLength(3)
  major: String;

  @IsString()
  @MinLength(3)
  degree: String;

  @IsDateString()
  @MaxDate(() => new Date())
  beginDate: Date;

  @IsOptional()
  @IsDateString()
  @MaxDate(() => new Date())
  endDate?: Date;
}

// used when creating education with user simultaneously
// the same class as CreateEducationDto but without userId key
export class EducationDto extends OmitType(CreateEducationDto, ['userId']) {}