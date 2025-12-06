import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MinLength,
  IsPhoneNumber,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  surname?: string;

  @IsOptional()
  @IsString()
  @IsPhoneNumber('PL')
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  city?: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  profileSummary?: string;
}
