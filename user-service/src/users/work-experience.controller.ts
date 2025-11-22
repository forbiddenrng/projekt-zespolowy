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
import { WorkExperienceDto } from './dto/create-work-experience.dto';
import { UpdateWorkExperienceDto } from './dto/update-work-experience.dto';

@Controller('users')
export class WorkExperienceController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/work-experiences (current user from x-user)
  @Get('work-experiences')
  findMine(@Req() req: any) {
    const reqUserId = req.userId;
    return this.usersService.listWorkExperiencesForCurrentUser(reqUserId);
  }

  // GET /users/:id/work-experiences (public by auth0Id)
  @Get(':id/work-experiences')
  findByAuth0Id(@Param('id') id: string) {
    return this.usersService.listWorkExperiencesByAuth0Id(id);
  }

  // POST /users/work-experiences
  @Post('work-experiences')
  create(@Req() req: any, @Body() dto: WorkExperienceDto) {
    const reqUserId = req.userId;
    return this.usersService.addWorkExperience(reqUserId, dto);
  }

  // PATCH /users/work-experiences/:id
  @Patch('work-experiences/:id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateWorkExperienceDto,
  ) {
    const reqUserId = req.userId;
    return this.usersService.updateWorkExperience(reqUserId, +id, dto);
  }

  // DELETE /users/work-experiences/:id
  @Delete('work-experiences/:id')
  remove(@Req() req: any, @Param('id') id: string) {
    const reqUserId = req.userId;
    return this.usersService.removeWorkExperience(reqUserId, +id);
  }
}
