import {
  ConnectedSocket,
  MessageBody,
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
import { cloneDeep, values } from 'lodash'

@UseGuards(JwtAuthGuard)
@WebSocketGateway({ cors: true })
export class SocketGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  constructor(private readonly redisService: RedisService) {}

  // handleConnection(@ConnectedSocket() socket: ISocketWithAuth) {}

  async handleDisconnect(@ConnectedSocket() socket: ISocketWithAuth) {
    const roomId = await this.redisService.getUserStatus(socket.user?.id)
    if (!roomId) return
    await this.leaveRoom(roomId, socket)
  }
  
  @SubscribeMessage(ESocketMessage.Message)
  message(@MessageBody() detail: { message: string; roomId: string }, @ConnectedSocket() socket: ISocketWithAuth) {
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
      await this.redisService.setRoom(roomId, room)
      await this.redisService.setUserStatus(user.id, roomId)

      socket.join(roomId)
      // 向自己以及房间内其他人发送加入消息更新房间
      const usersArr = values(room.users)
      socket.to(roomId).emit(ESocketMessage.Joined, { room, user })
      socket.emit(ESocketMessage.Joined, { room, user })

      if (usersArr.length !== 1) {
        // 创建房间的时候，不需要发送 PeerRequest
        usersArr.forEach((item) => {
          if (item.id === user.id) return
          socket.to(item.socketId).emit(ESocketMessage.PeerRequest, user)
        })
      }
    } catch (err) {
      Logger.error(err)
      return socket.emit(ESocketMessage.Warn, `操作失败，请稍后再试！`)
    }
  }

  @SubscribeMessage(ESocketMessage.Leave)
  async leaveRoom(@MessageBody() roomId: string, @ConnectedSocket() socket: ISocketWithAuth) {
    const room = await this.redisService.getRoom(roomId)
    delete room.users[socket.user.id]
    socket.to(roomId).emit(ESocketMessage.Leaved, { room, user: socket.user })
    socket.leave(roomId)
    await this.redisService.setUserStatus(socket.user.id, '')
    // if (!values(room.users).length) return await this.redisService.delRoom(roomId) //房间没人了就删掉房间
    await this.redisService.setRoom(roomId, room)
  }

  @SubscribeMessage(ESocketMessage.PeerConn)
  async peerConnect(@MessageBody() socketId: string, @ConnectedSocket() socket: ISocketWithAuth) {
    socket.user.socketId = socket.id
    socket.to(socketId).emit(ESocketMessage.PeerConn, socket.user)
  }

  @SubscribeMessage(ESocketMessage.Signal)
  async signal(
    @MessageBody()
    info: {
      socketId: string
      signal: SignalData
    },
    @ConnectedSocket() socket: ISocketWithAuth
  ) {
    const { socketId, signal } = info
    const signalingData = { signal, user: socket.user }
    socket.to(socketId).emit(ESocketMessage.Signal, signalingData)
  }
}
