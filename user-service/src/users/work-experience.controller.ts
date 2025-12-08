import { Controller, Body, Param, Req, Get, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { BulkWorkExperienceDto } from './dto/bulk-work-experience.dto';

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

  // PUT /users/work-experiences (bulk merge)
  @Put('work-experiences')
  bulkMerge(@Req() req: any, @Body() body: BulkWorkExperienceDto) {
    const reqUserId = req.userId;
    return this.usersService.mergeWorkExperiences(reqUserId, body);
  }
}
