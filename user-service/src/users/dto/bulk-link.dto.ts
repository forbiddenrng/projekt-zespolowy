import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';

export class LinkItemDto {
  @IsOptional()
  @IsInt()
  id?: number;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
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
