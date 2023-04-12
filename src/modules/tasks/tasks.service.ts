import { RedisService } from '@database/redis.service'
import { ESocketMessage } from '@models'
import { RoomService } from '@modules/room/room.service'
import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

@Injectable()
export class TasksService {
  constructor(private readonly redisService: RedisService, private readonly roomService: RoomService) {}

  // 每五分钟清理一遍幽灵房间  没有人的房间
  @Cron(CronExpression.EVERY_5_MINUTES)
  async clearGhostRoom() {
    const lock = await this.redisService.acquireLock(ESocketMessage.Match, 500)
    if (lock) {
      await this.roomService.clearGhostRooms()
      this.redisService.releaseLock(ESocketMessage.Match)
    }
  }
}
