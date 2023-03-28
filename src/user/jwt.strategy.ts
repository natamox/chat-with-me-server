import { PrismaService } from './../prisma/prisma.service'
import { ConfigService } from '@nestjs/config'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { HttpException, Injectable, Logger } from '@nestjs/common'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService, private prisma: PrismaService) {
    super({
      //解析用户提交的header中的Bearer Token数据
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      //加密码的 secret
      secretOrKey: configService.get('app.tokenSecret')
    })
  }

  //验证通过后获取用户资料
  async validate({ sub: id }) {
    return (
      await this.prisma.user.findUnique({ where: { id } }).catch((err) => {
        Logger.error(err)
        throw new HttpException('用户不存在！', 400)
      })
    ).id
  }
}
