import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common'
import { RoomService } from './room.service'
import { RedisService } from '@database/redis.service'
import { randomId } from '@utils/random-id'
import { Auth } from '@common/decorator/auth.decorator'
import { IRequestWithAuth, IRoom } from '@models'

@Auth()
@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService, private readonly redisService: RedisService) {}

  @Post()
  createRoom(@Req() { user }: IRequestWithAuth, @Body() { roomName }: { roomName: string }) {
    const roomId = randomId()
    const room = { roomId, roomName, users: {} } as IRoom
    this.redisService.set(`room:${roomId}`, JSON.stringify(room))
    return { roomId }
  }

  @Get()
  async findRoom(@Query() { roomId }: { roomId: string }) {
    const room = await this.redisService.getRoom(roomId)
    if (!room) return false
    return true
  }
}
