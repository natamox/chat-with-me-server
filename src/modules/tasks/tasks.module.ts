import { Module } from '@nestjs/common'
import { TasksService } from './tasks.service'
import { RoomModule } from '@modules/room/room.module'

@Module({
  imports: [RoomModule],
  providers: [TasksService]
})
export class TasksModule {}
