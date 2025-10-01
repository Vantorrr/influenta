import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/users/entities/user.entity';
// No direct AuthService dependency is required here

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {
    const secret = configService.get<string>('app.jwt.secret') ?? 'dev_change_me_secret';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    // Стягиваем актуальную роль пользователя из БД, чтобы не зависеть от старого токена
    let role: any = payload.role;
    try {
      const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
      if (user?.role) role = user.role;
    } catch {}

    return {
      id: payload.sub,
      telegramId: payload.telegramId,
      username: payload.username,
      role,
    } as Partial<User> & { id: string };
  }
}







