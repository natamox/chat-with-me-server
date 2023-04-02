import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets'
import { UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard'
import { ESocketMessage, ISocketWithAuth } from '@models'
import { RedisService } from '@database/redis.service'
import { randomId } from '@utils/random-id'
import { find } from 'lodash'
import { IRoom } from './entities/room.entities'

@UseGuards(JwtAuthGuard)
@WebSocketGateway({ cors: true })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly redisService: RedisService) {}

  handleConnection(@ConnectedSocket() socket: ISocketWithAuth) {
    console.log('socket.user', socket.user)
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
    const { users } = JSON.parse(await this.redisService.get(`room:${roomId}`)) as IRoom
    if (find(users, { id: socket.user.id })) {
      socket.emit(ESocketMessage.Message, `你已加入房间！`)
    } else {
      users.push(socket.user)
      this.redisService.set(`room:${roomId}`, JSON.stringify(users))
      socket.join(roomId)
      socket.emit(ESocketMessage.Message, `${roomId} joined`)
    }
  }

  @SubscribeMessage(ESocketMessage.Create)
  async createRoom(@MessageBody() roomName: string, @ConnectedSocket() socket: ISocketWithAuth) {
    const roomId = randomId()
    const room = { roomName, users: [socket.user] }
    this.redisService.set(`room:${roomId}`, JSON.stringify(room))
  }
}
