import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets'
import { Logger, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard'
import { ESocketMessage, ISocketWithAuth, SignalData } from '@models'
import { RedisService } from '@database/redis.service'
import { Server } from 'socket.io'
import { cloneDeep, omit, values } from 'lodash'

@UseGuards(JwtAuthGuard)
@WebSocketGateway({ cors: true })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  constructor(private readonly redisService: RedisService) {
  }

  handleConnection(@ConnectedSocket() socket: ISocketWithAuth) {
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
    try {
      const room = await this.redisService.getRoom(roomId)
      if (!room) return socket.emit(ESocketMessage.Warn, `未找到该房间！`)

      const user = cloneDeep(socket.user)
      user['socketId'] = socket.id
      room.users[user.id] = user
      console.log(room)
      await this.redisService.setRoom(roomId, room)

      socket.join(roomId)
      // 向自己以及房间内其他人发送加入消息更新房间
      const _room = {...room, users:values(room.users)}
      socket.to(roomId).emit(ESocketMessage.Joined, _room)
      socket.emit(ESocketMessage.Joined, _room)

      if(_room.users.length !== 1) { // 创建房间的时候，不需要发送 PeerRequest
        _room.users.forEach((_user) => {
          if(_user.id === user.id) return
          socket.to(_user.socketId).emit(ESocketMessage.PeerRequest, user)
        })
      }
    } catch (err) {
      Logger.error(err)
      return socket.emit(ESocketMessage.Message, `操作失败，请稍后再试！`)
    }
  }

  @SubscribeMessage(ESocketMessage.PeerConn)
  async connInit(@MessageBody() socketId: string, @ConnectedSocket() socket: ISocketWithAuth) {
    socket.user.socketId = socket.id
    socket.to(socketId).emit(ESocketMessage.PeerConn, socket.user)
  }

  @SubscribeMessage(ESocketMessage.Signal)
  async signal(@MessageBody() info: {
    socketId: string,
    signal: SignalData
  }, @ConnectedSocket() socket: ISocketWithAuth) {
    const { socketId, signal } = info
    const signalingData = { signal, user: socket.user }
    socket.to(socketId).emit(ESocketMessage.Signal, signalingData)
  }
}
