import { OmitType } from "@nestjs/mapped-types";
import {IsString, IsNotEmpty, MinLength} from "class-validator";


// used when creating link from a separate request
export class CreateLinkDto {
  @IsString()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @MinLength(5)
  linkString: String;
}

// used when creatng link with user simultaneously
export class LinkDto extends OmitType(CreateLinkDto, ['userId']) {}