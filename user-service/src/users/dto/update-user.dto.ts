import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsPhoneNumber,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  surname?: string;

  @IsOptional()
  @IsString()
  @IsPhoneNumber('PL')
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  profileSummary?: string;
}
