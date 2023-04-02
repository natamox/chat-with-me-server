import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets'
import { Logger, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard'
import { ESocketMessage, IRoom, ISocketWithAuth } from '@models'
import { RedisService } from '@database/redis.service'
import { randomId } from '@utils/random-id'
import { find } from 'lodash'

@UseGuards(JwtAuthGuard)
@WebSocketGateway({ cors: true })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly redisService: RedisService) {}

  handleConnection(@ConnectedSocket() socket: ISocketWithAuth) {
    // console.log('socket.user', socket.user)
    console.log('handleConnection')
  }

  handleDisconnect(@ConnectedSocket() socket: ISocketWithAuth) {
    console.log('handleDisconnect')
  }

  @SubscribeMessage(ESocketMessage.Message)
  message(@MessageBody() detail: { message: string; roomId: string }, @ConnectedSocket() socket: ISocketWithAuth) {
    console.log('roomId', detail)
    socket.to(detail.roomId).emit(ESocketMessage.Message, detail.message)
  }

  @SubscribeMessage(ESocketMessage.Join)
  async joinRoom(@MessageBody() roomId: string, @ConnectedSocket() socket: ISocketWithAuth) {
    const { redisService } = this
    try {
      const room = await redisService.getRoom(roomId)
      if (!room) return socket.emit(ESocketMessage.Message, `未找到该房间！`)
      const isUserAdded = room.users?.some((user) => user.id === socket.user.id)
      const isJoined = socket.rooms.has(roomId) && isUserAdded
      if (isJoined) return socket.emit(ESocketMessage.Message, `你已加入房间！`)
      if (!isJoined) {
        if (!isUserAdded) {
          room.users.push(socket.user)
          await redisService.setRoom(roomId, room)
        }
        socket.join(roomId)
        socket.emit(ESocketMessage.Message, `${roomId} joined`)
      }
    } catch (err) {
      Logger.error(err)
      return socket.emit(ESocketMessage.Message, `操作失败，请稍后再试！`)
    }
  }

  @SubscribeMessage(ESocketMessage.Create)
  async createRoom(@MessageBody() roomName: string, @ConnectedSocket() socket: ISocketWithAuth) {
    const roomId = randomId()
    const room = { roomName, users: [socket.user] }
    this.redisService.set(`room:${roomId}`, JSON.stringify(room))
  }
}
