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
  async getUserStatus(userId: string) {
    return (await this.get(`user_status:${userId}`)) ?? ''
  }

  /** 用户状态 是否在某个房间里*/
  async setUserStatus(userId: string, roomId: string) {
    await this.set(`user_status:${userId}`, roomId)
  }

  async acquireLock(key = 'common', timeout = 1000) {
    const value = Date.now() + timeout + 1
    const multi = this.multi()
    multi.set(`lock_${key}`, value, 'PX', timeout, 'NX')
    multi.expire(`lock_${key}`, timeout)
    const results = await multi.exec()
    return results[0][1] === 'OK'
  }

  async releaseLock(key = 'common') {
    return await this.del(`lock_${key}`)
  }

  // async acquireLock(timeout = 1000) {
  //   const value = Date.now() + timeout + 1
  //   const acquired = await this.set('lock', value, 'PX', timeout, 'NX')
  //   return acquired === 'OK'
  // }

  // async releaseLock() {
  //   return await this.del('lock')
  // }

  // async expireLock(timeout = 1000) {
  //   return await this.expire('lock', timeout)
  // }
}
