import { Module } from '@nestjs/common'
import { SocketGateway } from './socket.gateway'
import { JwtModule } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { RoomModule } from '@modules/room/room.module'

@Module({
  imports: [
    RoomModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          //设置加密使用的 secret
          secret: config.get('app.tokenSecret'),
          //过期时间
          signOptions: { expiresIn: '360d' }
        }
      }
    })
  ],
  providers: [SocketGateway]
})
export class SocketModule {}
