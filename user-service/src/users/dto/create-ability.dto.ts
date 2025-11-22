import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { OmitType } from '@nestjs/mapped-types';

// used when creating ability from a separate request
export class CreateAbilityDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @MinLength(10)
  name: string;
}

// used when creating user
export class AbilityDto extends OmitType(CreateAbilityDto, ['userId']) {}
