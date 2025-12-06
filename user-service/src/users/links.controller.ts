import { Controller, Body, Param, Req, Get, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { BulkLinksDto } from './dto/bulk-link.dto';

@Controller('users')
export class LinksController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/links (current user from x-user)
  @Get('links')
  findMine(@Req() req: any) {
    const reqUserId = req.userId;
    return this.usersService.listLinksForCurrentUser(reqUserId);
  }

  // GET /users/:id/links (public by auth0Id)
  @Get(':id/links')
  findByAuth0Id(@Param('id') id: string) {
    return this.usersService.listLinksByAuth0Id(id);
  }

  // PUT /users/links (bulk merge)
  @Put('links')
  bulkMerge(@Req() req: any, @Body() body: BulkLinksDto) {
    const reqUserId = req.userId;
    return this.usersService.mergeLinks(reqUserId, body);
  }
}
