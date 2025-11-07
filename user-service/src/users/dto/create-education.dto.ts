import {IsString, IsNotEmpty, IsDateString, IsOptional} from "class-validator";

export class CreateEducationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId?: String;

  @IsString()
  @IsNotEmpty()
  schoolName: String;

  @IsString()
  @IsNotEmpty()
  major: String;

  @IsString()
  @IsNotEmpty()
  degree: String;

  @IsDateString()
  @IsNotEmpty()
  beginDate: Date;

  @IsOptional()
  @IsNotEmpty()
  @IsDateString()
  endDate?: Date;
}