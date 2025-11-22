import { PartialType } from '@nestjs/mapped-types';
import { AbilityDto } from './create-ability.dto';

export class UpdateAbilityDto extends PartialType(AbilityDto) {}
