import { IMessage, IRoom } from '@models'
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
  // async clearGhostRoom() {
  //   const roomKeys = await this.keys('room:*')
  //   if (roomKeys.length === 0) return
  //   const roomValues = await this.mget(roomKeys)
  //   roomValues.forEach((value) => {
  //     const room = JSON.parse(value)
  //     if (Object.keys(room.users).length === 0) {
  //       this.delRoom(room.roomId)
  //     }
  //   })
  // }

  async getUserStatus(userId: string) {
    return (await this.get(`user_status:${userId}`)) ?? ''
  }
  /** 用户状态 是否在某个房间里*/
  async setUserStatus(userId: string, roomId: string) {
    await this.set(`user_status:${userId}`, roomId)
  }

  // async findMatchUser() {
  //   const keys = await this.get('user_match_queue')
  // }
}
