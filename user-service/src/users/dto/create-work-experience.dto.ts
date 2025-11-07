import {IsString, IsNotEmpty, IsDateString, IsOptional} from "class-validator";

export class CreateWorkExperienceDto{
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId?: String;

  @IsString()
  @IsNotEmpty()
  companyName: String;

  @IsString()
  @IsNotEmpty()
  position: String;

  @IsDateString()
  @IsNotEmpty()
  beginDate: Date;

  @IsOptional()
  @IsDateString()
  @IsNotEmpty()
  endDate?: Date;

  @IsString()
  @IsNotEmpty()
  description: String;
}