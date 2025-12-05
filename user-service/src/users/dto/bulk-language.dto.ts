import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsEnum,
} from 'class-validator';

enum LanguageLevel {
  A0 = 'A0',
  A1 = 'A1',
  A2 = 'A2',
  A2_PLUS = 'A2+',
  B1 = 'B1',
  B2 = 'B2',
  B2_PLUS = 'B2+',
  C1 = 'C1',
  C2 = 'C2',
  NATIVE = 'Native',
}

export class LanguageItemDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsNotEmpty()
  @IsInt()
  languageId: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(6)
  @IsEnum(LanguageLevel)
  level: string;
}

export class BulkLanguagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LanguageItemDto)
  languages: LanguageItemDto[];
}
