import { PartialType } from '@nestjs/mapped-types';
import { EducationDto } from './create-education.dto';

export class UpdateEducationDto extends PartialType(EducationDto) {}
