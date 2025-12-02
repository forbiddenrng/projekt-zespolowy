import { OmitType } from '@nestjs/mapped-types';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { MaxNow } from 'src/validators/max-now.validator';

// used when creating work experience from a separate request
export class CreateWorkExperienceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  companyName: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  position: string;

  @IsDateString()
  @MaxNow({ message: 'maximal allowed date for beginDate is now' })
  beginDate: string;

  @IsOptional()
  @IsDateString()
  @MaxNow({ message: 'maximal allowed date for endDate is now' })
  endDate?: string;

  @IsString()
  @MinLength(10)
  description: string;
}
export class WorkExperienceDto extends OmitType(CreateWorkExperienceDto, [
  'userId',
]) {}
