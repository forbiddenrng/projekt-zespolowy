import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  MinLength,
  MaxLength
} from 'class-validator';
import { OmitType } from '@nestjs/mapped-types';
import { MaxNow } from 'src/validators/max-now.validator';

// used when creating education from a separate request
export class CreateEducationDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId: string;

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
  beginDate: Date;

  @IsOptional()
  @IsDateString()
  @MaxNow({ message: 'maximal allowed date for endDate is now' })
  endDate?: Date;
}

// used when creating education with user simultaneously
// the same class as CreateEducationDto but without userId key
export class EducationDto extends OmitType(CreateEducationDto, ['userId']) {}
