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
import { LanguageDto } from './dto/create-language.dto';
import { UpdateLanguageDto } from './dto/update-language.dto';

@Controller('users')
export class LanguagesController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/languages (current user from x-user)
  @Get('languages')
  findMine(@Req() req: any) {
    const reqUserId = req.userId;
    return this.usersService.listLanguagesForCurrentUser(reqUserId);
  }

  // GET /users/:id/languages (public by auth0Id)
  @Get(':id/languages')
  findByAuth0Id(@Param('id') id: string) {
    return this.usersService.listLanguagesByAuth0Id(id);
  }

  // POST /users/languages
  @Post('languages')
  create(@Req() req: any, @Body() dto: LanguageDto) {
    const reqUserId = req.userId;
    return this.usersService.addLanguage(reqUserId, dto);
  }

  // PATCH /users/languages/:id
  @Patch('languages/:id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateLanguageDto,
  ) {
    const reqUserId = req.userId;
    return this.usersService.updateLanguage(reqUserId, +id, dto);
  }

  // DELETE /users/languages/:id
  @Delete('languages/:id')
  remove(@Req() req: any, @Param('id') id: string) {
    const reqUserId = req.userId;
    return this.usersService.removeLanguage(reqUserId, +id);
  }
}
