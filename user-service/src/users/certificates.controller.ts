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
import { CertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';

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

  // POST /users/certificates
  @Post('certificates')
  create(@Req() req: any, @Body() dto: CertificateDto) {
    const reqUserId = req.userId;
    return this.usersService.addCertificate(reqUserId, dto);
  }

  // PATCH /users/certificates/:id
  @Patch('certificates/:id')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCertificateDto,
  ) {
    const reqUserId = req.userId;
    return this.usersService.updateCertificate(reqUserId, +id, dto);
  }

  // DELETE /users/certificates/:id
  @Delete('certificates/:id')
  remove(@Req() req: any, @Param('id') id: string) {
    const reqUserId = req.userId;
    return this.usersService.removeCertificate(reqUserId, +id);
  }
}
