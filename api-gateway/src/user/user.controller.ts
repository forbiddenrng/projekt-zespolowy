import { Controller, UseGuards, Get, Req } from '@nestjs/common';
import {JwtAuthGuarded} from "../auth/auth.guard"

@Controller('user')
@UseGuards(JwtAuthGuarded)
export class UserController {
  @Get('profile')
  getProfile(@Req() req){
    return req.user;
  }

}
