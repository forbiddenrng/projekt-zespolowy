import { IsString, IsNotEmpty, MinLength } from "class-validator";
import { OmitType } from "@nestjs/mapped-types";

// used when creating ability from a separate request
export class CreateAbilityDto {
  @IsString()
  @IsNotEmpty()
  userId: String;

  @IsString()
  @MinLength(10)
  name: String;
}

// used when creating user 
export class AbilityDto extends OmitType(CreateAbilityDto, ['userId']) {}

