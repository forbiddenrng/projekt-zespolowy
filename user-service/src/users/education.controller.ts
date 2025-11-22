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
import { EducationDto } from './dto/create-education.dto';
import { UpdateEducationDto } from './dto/update-education.dto';

@Controller('users')
export class EducationController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/education (current user from x-user)
  @Get('education')
  findMine(@Req() req: any) {
    const reqUserId = req.userId;
    return this.usersService.listEducationForCurrentUser(reqUserId);
  }

  // GET /users/:id/education (public by auth0Id)
  @Get(':id/education')
  findByAuth0Id(@Param('id') id: string) {
    return this.usersService.listEducationByAuth0Id(id);
  }

  // POST /users/education
  @Post('education')
  create(@Req() req: any, @Body() dto: EducationDto) {
    const reqUserId = req.userId;
    return this.usersService.addEducation(reqUserId, dto);
  }

  // PATCH /users/education/:id
  @Patch('education/:id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateEducationDto,
  ) {
    const reqUserId = req.userId;
    return this.usersService.updateEducation(reqUserId, +id, dto);
  }

  // DELETE /users/education/:id
  @Delete('education/:id')
  remove(@Req() req: any, @Param('id') id: string) {
    const reqUserId = req.userId;
    return this.usersService.removeEducation(reqUserId, +id);
  }
}
