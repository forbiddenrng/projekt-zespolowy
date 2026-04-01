import { IsString, IsNotEmpty, MinLength, IsOptional, MaxLength } from 'class-validator';
import { OmitType } from '@nestjs/mapped-types';

// used when creating ability from a separate request
export class CreateAbilityDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;
}

// used when creating user
export class AbilityDto extends OmitType(CreateAbilityDto, ['userId']) {}
