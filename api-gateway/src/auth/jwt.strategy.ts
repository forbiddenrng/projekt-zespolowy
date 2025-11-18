import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import {ExtractJwt, Strategy} from "passport-jwt";
import * as jwksRsa from "jwks-rsa";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt'){
  constructor(){
    super({
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksUri: process.env.AUTH0_JWKS_URI as string
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: process.env.AUTH0_AUDIENCE,
      issuer: process.env.AUTH0_ISSUER,
      algorithms: ['RS256']
    })
  }

  async validate(payload: any) {
    return payload;
  }
}