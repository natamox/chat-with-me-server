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

  async delRoom(roomId: string) {
    await this.del(`room:${roomId}`)
  }

  async setRoom(roomId: string, room: IRoom) {
    await this.set(`room:${roomId}`, JSON.stringify(room))
  }

  async getUserStatus(userId: string) {
    return (await this.get(`user_status:${userId}`)) ?? ''
  }
  /** 用户状态 */
  async setUserStatus(userId: string, roomId: string) {
    await this.set(`user_status:${userId}`, roomId)
  }
}
