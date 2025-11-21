import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { FindOneQueryParams } from 'src/ts/types';

/** Response structure
 * {
 *  status: "success" | "error"
 *  code: HTTP Code
 *  data: {} | null
 *  error: {
 *    message: String
 *  } | null
 *
 * }
 *
 */

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  // @Get('abilities/:id')
  // findOneAbilities(@Param('id') id: string){
  //   return this.usersService.findOneAbilities(id);
  // }

  // GET /users/me - returns currently signed in user (x-user -> req.userId)
  @Get('me')
  findMe(
    @Req() req: any,
    @Query('abilities') abilities: string,
    @Query('certificates') certificates: string,
    @Query('education') education: string,
    @Query('languages') languages: string,
    @Query('links') links: string,
    @Query('work') work: string,
    @Query('all') all: string,
  ) {
    const id = req.userId;
    return this.usersService.findOne(id, {
      abilities,
      certificates,
      education,
      languages,
      links,
      work,
      all,
    } as FindOneQueryParams);
  }

  // GET /users/:id - returns user by auth0Id
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('abilities') abilities: string,
    @Query('certificates') certificates: string,
    @Query('education') education: string,
    @Query('languages') languages: string,
    @Query('links') links: string,
    @Query('work') work: string,
    @Query('all') all: string,
  ) {
    return this.usersService.findOne(id, {
      abilities,
      certificates,
      education,
      languages,
      links,
      work,
      all,
    } as FindOneQueryParams);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: Prisma.UserUpdateInput,
  ) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
