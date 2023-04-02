import { Body, Controller, Post, Req } from '@nestjs/common'
import { RoomService } from './room.service'
import { RedisService } from '@database/redis.service'
import { randomId } from '@utils/random-id'
import { Auth } from '@common/decorator/auth.decorator'
import { IRequestWithAuth } from '@models'

@Auth()
@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService, private readonly redisService: RedisService) {}

  @Post()
  createRoom(@Req() { user }: IRequestWithAuth, @Body() { roomName }: { roomName: string }) {
    const roomId = randomId()
    // const room = { roomName, users: [user] }
    // this.redisService.set(`room:${roomId}`, JSON.stringify(room))
    return { roomId }
  }
}
