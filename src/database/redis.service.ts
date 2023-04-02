import { IRoom } from '@models'
import { Injectable } from '@nestjs/common'
import Redis from 'ioredis'

class RedisClient extends Redis {
  constructor() {
    super({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT as any as number,
      password: process.env.REDIS_PASSWORD
    })
  }
}

@Injectable()
export class RedisService extends RedisClient {
  async getRoom(roomId: string): Promise<IRoom> {
    const room = await this.get(`room:${roomId}`)
    return JSON.parse(room)
  }

  async setRoom(roomId: string, room: IRoom) {
    await this.set(`room:${roomId}`, JSON.stringify(room))
  }
}
