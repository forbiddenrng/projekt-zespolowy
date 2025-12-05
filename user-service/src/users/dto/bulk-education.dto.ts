import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  MinLength,
  MaxLength,
  IsInt,
} from 'class-validator';
import { MaxNow } from 'src/validators/max-now.validator';

export class EducationItemDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  schoolName: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  major: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  degree: string;

  @IsDateString()
  @MaxNow({ message: 'maximal allowed date for beginDate is now' })
  beginDate: string;

  @IsOptional()
  @IsDateString()
  @MaxNow({ message: 'maximal allowed date for endDate is now' })
  endDate?: string;
}

export class BulkEducationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationItemDto)
  education: EducationItemDto[];
}
