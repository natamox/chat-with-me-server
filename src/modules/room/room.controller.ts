import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common'
import { RoomService } from './room.service'
import { RedisService } from '@database/redis.service'
import { randomId } from '@utils/random-id'
import { Auth } from '@common/decorator/auth.decorator'
import { ERoomType, IRequestWithAuth, IRoom } from '@models'

@Auth()
@Controller('room')
export class RoomController {
  constructor(private readonly roomService: RoomService, private readonly redisService: RedisService) {}

  @Post()
  createRoom(@Req() { user }: IRequestWithAuth, @Body() { roomName, type }: IRoom) {
    // const room: IRoom = { roomId, roomName, users: {}, message: [], type: ERoomType.Chat }
    // this.redisService.set(`room:${roomId}`, JSON.stringify(room))
    // return { roomId }
    return this.roomService.createRoom(roomName, type)
  }

  @Get()
  async findRoom(@Query() { roomId }: { roomId: string }) {
    const room = await this.roomService.findRoom(roomId)
    if (!room) return false
    return true
  }

  @Get('/list')
  async findAllRoom() {
    return await this.roomService.findAllRooms()
  }

  @Get()
  async matchRoom(@Req() { user }: IRequestWithAuth) {
    // const room = await this.redisService.getRoom(roomId)
    // if (!room) return false
    // return true
  }
}
