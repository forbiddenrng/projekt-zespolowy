import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsInt,
} from 'class-validator';

export class AbilityItemDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;
}

export class BulkAbilitiesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AbilityItemDto)
  abilities: AbilityItemDto[];
}
