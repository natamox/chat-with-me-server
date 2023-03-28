import { Module } from '@nestjs/common'
import { NestLogsModule } from 'nest-logs'
import { ScheduleModule } from '@nestjs/schedule'
import { ConfigModule } from '@nestjs/config'
import { UserModule } from './user/user.module'
import configurationYaml from './common/config/configuration.yaml'
import { PrismaModule } from './prisma/prisma.module'
import { SocketModule } from './socket/socket.module';

@Module({
  imports: [
    NestLogsModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true, load: [configurationYaml] }),
    PrismaModule,
    UserModule,
    SocketModule
  ]
})
export class AppModule {}
