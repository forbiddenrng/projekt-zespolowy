import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Get,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AbilityDto } from './dto/create-ability.dto';
import { UpdateAbilityDto } from './dto/update-ability.dto';

@Controller('users')
export class AbilitiesController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/abilities (current user from x-user)
  @Get('abilities')
  findMine(@Req() req: any) {
    const reqUserId = req.userId;
    return this.usersService.listAbilitiesForCurrentUser(reqUserId);
  }

  // GET /users/:id/abilities (public by auth0Id)
  @Get(':id/abilities')
  findByAuth0Id(@Param('id') id: string) {
    return this.usersService.listAbilitiesByAuth0Id(id);
  }

  // POST /users/abilities
  @Post('abilities')
  create(@Req() req: any, @Body() dto: AbilityDto) {
    const reqUserId = req.userId;
    return this.usersService.addAbility(reqUserId, dto);
  }

  // PATCH /users/abilities/:id
  @Patch('abilities/:id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateAbilityDto,
  ) {
    const reqUserId = req.userId;
    return this.usersService.updateAbility(reqUserId, +id, dto);
  }

  // DELETE /users/abilities/:id
  @Delete('abilities/:id')
  remove(@Req() req: any, @Param('id') id: string) {
    const reqUserId = req.userId;
    return this.usersService.removeAbility(reqUserId, +id);
  }
}
