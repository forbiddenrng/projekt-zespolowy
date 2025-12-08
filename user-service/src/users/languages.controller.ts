import { Controller, Body, Param, Req, Get, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { BulkLanguagesDto } from './dto/bulk-language.dto';

@Controller('users')
export class LanguagesController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/languages (current user from x-user)
  @Get('languages')
  findMine(@Req() req: any) {
    const reqUserId = req.userId;
    return this.usersService.listLanguagesForCurrentUser(reqUserId);
  }

  //GET /users/languages/all
  @Get('languages/all')
  findAll(@Req() req: any) {
    return this.usersService.getAllLanguages();
  }

  // GET /users/:id/languages (public by auth0Id)
  @Get(':id/languages')
  findByAuth0Id(@Param('id') id: string) {
    return this.usersService.listLanguagesByAuth0Id(id);
  }

  // PUT /users/languages (bulk merge)
  @Put('languages')
  bulkMerge(@Req() req: any, @Body() body: BulkLanguagesDto) {
    const reqUserId = req.userId;
    return this.usersService.mergeLanguages(reqUserId, body);
  }
}
