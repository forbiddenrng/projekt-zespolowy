import { PartialType } from '@nestjs/mapped-types';
import { LanguageDto } from './create-language.dto';

export class UpdateLanguageDto extends PartialType(LanguageDto) {}
