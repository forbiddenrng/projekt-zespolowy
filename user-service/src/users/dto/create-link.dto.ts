import { OmitType } from '@nestjs/mapped-types';
import { IsString, IsNotEmpty, MinLength, IsOptional, MaxLength, IsUrl } from 'class-validator';

// used when creating link from a separate request
export class CreateLinkDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @MinLength(5)
  @MaxLength(150)
  // @IsUrl()
  linkString: string;
}

// used when creatng link with user simultaneously
export class LinkDto extends OmitType(CreateLinkDto, ['userId']) {}
