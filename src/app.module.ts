import configurationYaml from '@common/config/configuration.yaml'
import { DataBaseModule } from '@database/database.module'
import { RoomModule } from '@modules/room/room.module'
import { SocketModule } from '@modules/socket/socket.module'
import { UserModule } from '@modules/user/user.module'
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ScheduleModule } from '@nestjs/schedule'
import { NestLogsModule } from 'nest-logs'

@Module({
  imports: [
    NestLogsModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true, load: [configurationYaml] }),
    UserModule,
    RoomModule,
    DataBaseModule,
    SocketModule
  ]
})
export class AppModule {}
