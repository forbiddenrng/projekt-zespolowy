import { IsArray, Matches, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  MinLength,
  MaxLength,
} from 'class-validator';

export class LinkItemDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsString()
  @IsNotEmpty()
  @Matches(/^https?:\/\/.+/, {
    message: 'Link must start with http:// or https://',
  })
  @MinLength(5)
  @MaxLength(150)
  linkString: string;
}

export class BulkLinksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkItemDto)
  links: LinkItemDto[];
}
