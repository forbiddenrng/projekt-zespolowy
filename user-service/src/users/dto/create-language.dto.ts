import { IsInt, IsString, IsNotEmpty, IsOptional } from 'class-validator';

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
  level: string;
}
