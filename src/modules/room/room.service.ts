import { PrismaService } from '@database/prisma.service'
import { ERoomType, IMessage } from '@models'
import { Injectable } from '@nestjs/common'
import { randomId } from '@utils/random-id'
import { cloneDeep } from 'lodash'

@Injectable()
export class RoomService {
  constructor(private readonly prismaService: PrismaService) {}

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
}
