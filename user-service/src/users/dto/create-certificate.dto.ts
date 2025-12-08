import {
  IsString,
  IsNotEmpty,
  IsDateString,
  MinLength,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { OmitType } from '@nestjs/mapped-types';
import { MaxNow } from 'src/validators/max-now.validator';

// used when creating certificate from a separate request
export class CreateCertificateDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(3)
  @MaxLength(255)
  issuer: string;

  @IsDateString()
  @MaxNow({ message: 'maximal certification date is now' })
  certificationDate: string;
}
//used when creating a user
export class CertificateDto extends OmitType(CreateCertificateDto, [
  'userId',
]) {}
