import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'btm_secret_key',
    });
  }

  async validate(payload: any) {
    // This payload is what you set in AuthService (sub + email)
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
