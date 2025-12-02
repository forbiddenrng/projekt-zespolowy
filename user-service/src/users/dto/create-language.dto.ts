import { IsInt, IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class LanguageDto {
  @IsNotEmpty()
  @IsInt()
  languageId: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(6)
  level: string;
}
