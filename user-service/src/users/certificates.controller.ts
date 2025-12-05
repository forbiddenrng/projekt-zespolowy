import { Controller, Body, Param, Req, Get, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { BulkCertificatesDto } from './dto/bulk-certificate.dto';

@Controller('users')
export class CertificatesController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/certificates (current user from x-user)
  @Get('certificates')
  findMine(@Req() req: any) {
    const reqUserId = req.userId;
    return this.usersService.listCertificatesForCurrentUser(reqUserId);
  }

  // GET /users/:id/certificates (public by auth0Id)
  @Get(':id/certificates')
  findByAuth0Id(@Param('id') id: string) {
    return this.usersService.listCertificatesByAuth0Id(id);
  }

  // PUT /users/certificates (bulk merge)
  @Put('certificates')
  bulkMerge(@Req() req: any, @Body() body: BulkCertificatesDto) {
    const reqUserId = req.userId;
    return this.usersService.mergeCertificates(reqUserId, body);
  }
}
