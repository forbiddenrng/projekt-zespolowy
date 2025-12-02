import { IsInt, IsString, IsNotEmpty, IsOptional, MaxLength, IsEnum } from 'class-validator';

enum LanguageLevel {
  A0 = "A0",
  A1 = "A1",
  A2 = "A2",
  A2_PLUS = "A2+",
  B1 = "B1",
  B2 = "B2",
  B2_PLUS = "B2+",
  C1 = "C1",
  C2 = "C2",
  NATIVE = "Native",
}

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
  @IsEnum(LanguageLevel)
  level: string;
}
