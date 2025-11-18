import { Injectable } from "@nestjs/common";
import {AuthGuard} from "@nestjs/passport";

@Injectable()
export class JwtAuthGuarded extends AuthGuard('jwt'){}