import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  IsString,
  IsDateString,
  IsOptional,
  MinLength,
  MaxLength,
  IsInt,
} from 'class-validator';
import { MaxNow } from 'src/validators/max-now.validator';

export class WorkExperienceItemDto {
  @IsOptional()
  @IsInt()
  id?: number;

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

export class BulkWorkExperienceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkExperienceItemDto)
  workExperiences: WorkExperienceItemDto[];
}
