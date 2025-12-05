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

export class CertificateItemDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(3)
  @MaxLength(255)
  issuer: string;

  @IsDateString()
  @MaxNow({ message: 'maximal allowed date for certificationDate is now' })
  certificationDate: string;
}

export class BulkCertificatesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificateItemDto)
  certificates: CertificateItemDto[];
}
