import { IsString, IsNotEmpty, IsDateString, MinLength, MaxDate } from "class-validator";
import { OmitType } from "@nestjs/mapped-types";

// used when creating certificate from a separate request
export class CreateCertificateDto {
  @IsString()
  @IsNotEmpty()
  userId: String;

  @IsString()
  @MinLength(10)
  name: String;

  @IsString()
  @MinLength(3)
  issuer: String;

  @IsDateString()
  @MaxDate(() => new Date())
  certificationDate: Date;
}
//used when creating a user
export class CertificateDto extends OmitType(CreateCertificateDto, ['userId']) {}