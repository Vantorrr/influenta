import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/users/entities/user.entity';

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
    const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }
    if (user.isBanned) {
      throw new UnauthorizedException(
        user.banReason
          ? `Аккаунт заблокирован: ${user.banReason}`
          : 'Аккаунт заблокирован администратором',
      );
    }

    return {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      role: user.role,
      isBanned: user.isBanned,
      isVerified: user.isVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.companyName,
      website: (user as any).website,
    } as Partial<User> & { id: string };
  }
}
