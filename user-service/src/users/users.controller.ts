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
  BadRequestException,
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

  // POST /users  — create uses auth0 id from header (x-user)
  @Post()
  create(@Req() req: any, @Body() createUserDto: CreateUserDto) {
    const reqUserId = req.userId;
    if (!reqUserId) {
      throw new BadRequestException('User id not provided in x-user header');
    }
    // override auth0Id from header (ignore client-sent auth0Id)
    createUserDto.auth0Id = reqUserId;
    return this.usersService.create(createUserDto);
  }

  // GET /users/profile-exists (current user via x-user header)
  @Get('profile-exists')
  findMyProfileExists(@Req() req: any) {
    const reqUserId = req.userId;
    if (!reqUserId) {
      throw new BadRequestException('User id not provided in x-user header');
    }
    return this.usersService.profileExistsForCurrentUser(reqUserId);
  }

  // GET /users/:id/profile-exists (public by auth0Id)
  @Get(':id/profile-exists')
  findProfileExistsByAuth0Id(@Param('id') id: string) {
    return this.usersService.profileExistsByAuth0Id(id);
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
    if (!id) {
      throw new BadRequestException('User id not provided in x-user header');
    }

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
