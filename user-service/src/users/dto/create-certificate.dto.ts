import { IsString, IsNotEmpty, IsDate, MinLength, MaxDate } from "class-validator";
import { Type } from "class-transformer";
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

  // @IsDateString()
  @IsDate()
  @Type(() => Date)
  @MaxDate(() => new Date(), {
    message: () => `maximal certification date is ${new Date().toISOString()}`
  })
  certificationDate: Date;
}
//used when creating a user
export class CertificateDto extends OmitType(CreateCertificateDto, ['userId']) {}