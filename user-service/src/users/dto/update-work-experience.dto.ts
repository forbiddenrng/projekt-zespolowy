import { PartialType } from '@nestjs/mapped-types';
import { WorkExperienceDto } from './create-work-experience.dto';

export class UpdateWorkExperienceDto extends PartialType(WorkExperienceDto) {}
