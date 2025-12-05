import { Controller, Body, Param, Req, Get, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { BulkEducationDto } from './dto/bulk-education.dto';

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

  // PUT /users/education (bulk merge)
  @Put('education')
  bulkMerge(@Req() req: any, @Body() body: BulkEducationDto) {
    const reqUserId = req.userId;
    return this.usersService.mergeEducation(reqUserId, body);
  }
}
