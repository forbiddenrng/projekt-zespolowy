import { PartialType } from '@nestjs/mapped-types';
import { LinkDto } from './create-link.dto';

export class UpdateLinkDto extends PartialType(LinkDto) {}
