import { PrismaService } from '@database/prisma.service'
import { RedisService } from '@database/redis.service'
import { ERoomType, ESocketMessage, IMessage } from '@models'
import { Injectable } from '@nestjs/common'
import { randomId } from '@utils/random-id'
import { cloneDeep } from 'lodash'

@Injectable()
export class RoomService {
  constructor(private readonly prismaService: PrismaService, private readonly redisService: RedisService) {}

  async createRoom(roomName: string, type: ERoomType) {
    const roomId = randomId()
    const res = await this.prismaService.room.create({
      data: {
        roomId,
        roomName,
        type,
        users: '{}',
        message: '[]'
      }
    })
    return { roomId: res.roomId }
  }

  findRoom(roomId: string) {
    return this.prismaService.room.findUnique({
      where: {
        roomId
      }
    })
  }

  async findAllRooms() {
    const rooms = await this.prismaService.room.findMany({
      where: {
        type: ERoomType.Chat
      },
      select: {
        roomId: true,
        roomName: true,
        type: true,
        users: true
      }
    })
    const _rooms = []
    rooms.forEach((room) => {
      const users = JSON.parse(room.users)
      // 过滤掉没有人的房间
      if (Object.keys(users).length !== 0) {
        const _room = cloneDeep(room)
        _room.users = users
        _rooms.push(_room)
      }
    })
    return _rooms
  }

  updateRoomUsers(roomId: string, users: string) {
    return this.prismaService.room.update({
      where: {
        roomId
      },
      data: {
        users
      }
    })
  }

  async updateRoomMessage(roomId: string, message: IMessage) {
    const room = await this.findRoom(roomId)
    const messages = JSON.parse(room.message)
    messages.push(message)
    return this.prismaService.room.update({
      where: {
        roomId
      },
      data: {
        message: JSON.stringify(messages)
      }
    })
  }

  async clearGhostRooms() {
    const rooms = await this.prismaService.room.findMany()
    const ghostRoomIds = []
    rooms.forEach((room) => {
      const users = JSON.parse(room.users)
      if (Object.keys(users).length === 0) {
        ghostRoomIds.push(room.roomId)
      }
    })
    return this.batchDeleteRoom(ghostRoomIds)
  }

  batchDeleteRoom(roomIds: string[]) {
    return this.prismaService.room.deleteMany({
      where: {
        roomId: {
          in: roomIds
        }
      }
    })
  }

  async matchUser(userId: string) {
    let roomId = null
    let matchUserId = null
    let lock = null
    let counter = 0
    const maxTime = 1 * 60 * 1000 // 最大等待时间为 1 分钟
    const peerTimeGap = 1000 // 每次匹配的时间间隔
    // 开始循环匹配
    while (true) {
      counter += peerTimeGap // 每秒执行一次操作
      roomId = await this.redisService.getUserStatus(userId)
      if (roomId) {
        // 如果用户已经在房间中，直接返回房间号
        await this.redisService.srem('user_match', userId)
        if (lock) {
          await this.redisService.releaseLock(ESocketMessage.Match)
        }
        return roomId
      }
      // 如果已经超时，则停止执行操作并返回结果
      if (counter >= maxTime) {
        if (lock) {
          await this.redisService.releaseLock(ESocketMessage.Match)
        }
        return null
      }
      // 尝试获取匹配池锁
      lock = await this.redisService.acquireLock(ESocketMessage.Match, 1000)
      if (!lock) {
        // 如果获取锁失败，表示有其他用户正在操作，等待下一次匹配
        await new Promise((resolve) => setTimeout(resolve, peerTimeGap))
        continue
      }
      try {
        // 尝试从匹配池中获取其他用户
        matchUserId = await this.redisService.srandmember('user_match')
        if (matchUserId && matchUserId !== userId) {
          // 如果匹配成功，创建房间并更新用户状态
          const room = await this.createRoom('匹配房间', ERoomType.Match)
          await this.redisService.setUserStatus(userId, room.roomId)
          await this.redisService.setUserStatus(matchUserId, room.roomId)
          await this.redisService.srem('user_match', matchUserId)
          roomId = room.roomId
          break
        } else {
          // 如果匹配池中没有其他用户，将自己加入匹配池
          await this.redisService.sadd('user_match', userId)
        }
      } finally {
        // 释放匹配池锁
        if (lock) {
          await this.redisService.releaseLock(ESocketMessage.Match)
          await new Promise((resolve) => setTimeout(resolve, peerTimeGap))
        }
      }
    }
    return roomId
  }
}
