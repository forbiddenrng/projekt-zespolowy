import {IsString, IsNotEmpty} from "class-validator";

export class CreateLinkDto {
  @IsString()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  linkString: String;
}
