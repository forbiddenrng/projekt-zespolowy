import { Controller, Body, Param, Req, Get, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { BulkAbilitiesDto } from './dto/bulk-ability.dto';

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

  // PUT /users/abilities (bulk merge)
  @Put('abilities')
  bulkMerge(@Req() req: any, @Body() body: BulkAbilitiesDto) {
    const reqUserId = req.userId;
    return this.usersService.mergeAbilities(reqUserId, body);
  }
}
