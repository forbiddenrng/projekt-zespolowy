import {IsInt, IsString, IsNotEmpty } from "class-validator";

export class LanguageDto {
  @IsNotEmpty()
  @IsInt()
  languageId: number;

  @IsString()
  @IsNotEmpty()
  userId: String;

  @IsNotEmpty()
  @IsString()
  level: string;
}