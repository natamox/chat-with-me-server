import { Module } from '@nestjs/common'
import { NestLogsModule } from 'nest-logs'
import { ScheduleModule } from '@nestjs/schedule'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { UserModule } from './user/user.module'
import configurationYaml from './common/config/configuration.yaml'
import { SocketModule } from './socket/socket.module'
import { DataBaseModule } from './database/database.module'
import { JwtModule } from '@nestjs/jwt'

@Module({
  imports: [
    NestLogsModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true, load: [configurationYaml] }),
    UserModule,
    DataBaseModule,
    SocketModule
  ]
})
export class AppModule {}
