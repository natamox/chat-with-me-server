import { PrismaService } from '@database/prisma.service'
import { ExecutionContext, HttpException, Injectable, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AuthGuard } from '@nestjs/passport'
import { pick } from 'lodash'
import { Socket } from 'socket.io'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly prisma: PrismaService, private readonly jwtService: JwtService) {
    super()
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient<Socket>()
    const token = client.handshake.headers.authorization
    const validatedUser = await this.validateToken(token)
    if (!validatedUser) {
      client.disconnect()
      return false
    }
    client['user'] = validatedUser
    return true
  }

  async validateToken(token: string): Promise<any> {
    // 在这里使用您的 JwtStrategy 验证令牌并返回用户信息
    const res = this.jwtService.verify(token.replace('Bearer ', ''))
    const user = await this.prisma.user.findUnique({ where: { id: res.sub } }).catch((err) => {
      Logger.error(err)
      throw new HttpException('用户不存在！', 400)
    })
    return pick(user, ['id', 'username'])
  }
}
