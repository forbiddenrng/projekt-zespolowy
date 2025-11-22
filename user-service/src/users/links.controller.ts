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
import { LinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';

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

  // POST /users/links
  @Post('links')
  create(@Req() req: any, @Body() dto: LinkDto) {
    const reqUserId = req.userId;
    return this.usersService.addLink(reqUserId, dto);
  }

  // PATCH /users/links/:id
  @Patch('links/:id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateLinkDto) {
    const reqUserId = req.userId;
    return this.usersService.updateLink(reqUserId, +id, dto);
  }

  // DELETE /users/links/:id
  @Delete('links/:id')
  remove(@Req() req: any, @Param('id') id: string) {
    const reqUserId = req.userId;
    return this.usersService.removeLink(reqUserId, +id);
  }
}
