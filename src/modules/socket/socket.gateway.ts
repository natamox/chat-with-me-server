import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer
} from '@nestjs/websockets'
import { Logger, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard'
import { ESocketMessage, ISocketWithAuth } from '@models'
import { RedisService } from '@database/redis.service'
import { ISignalData } from './dto/update-user.dto'
import { Server } from 'socket.io'

@UseGuards(JwtAuthGuard)
@WebSocketGateway({ cors: true })
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly redisService: RedisService) {}
  @WebSocketServer()
  server: Server

  handleConnection(@ConnectedSocket() socket: ISocketWithAuth) {
    // console.log('socket.user', socket.user)
    console.log('handleConnection')
  }

  handleDisconnect(@ConnectedSocket() socket: ISocketWithAuth) {
    console.log('handleDisconnect')
    console.log(socket.rooms)
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
      const isUserAdded = room.users?.some((user) => user.id === socket.user.id)
      if (isUserAdded) {
        // 前端刷新浏览器，需要更新 socket.id
        room.users.find((item) => item.id === socket.user.id).socketId = socket.id
        await this.redisService.setRoom(roomId, room)
        socket.emit(ESocketMessage.Warn, `你已加入房间！`)
      }
      if (!isUserAdded) {
        socket.user.socketId = socket.id
        room.users.push(socket.user)
        await this.redisService.setRoom(roomId, room)
        socket.emit(ESocketMessage.Info, `${room.roomName} 已加入！`)
      }
      socket.join(roomId)
      socket.to(roomId).emit(ESocketMessage.Joined, room)
      socket.emit(ESocketMessage.Joined, room)
      if(room.users.length !== 1) { // 创建房间的时候，不需要发送 connPre
        room.users.forEach((user) => {
          socket.to(user.socketId).emit(ESocketMessage.PeerRequest, socket.id)
        })
      }
      console.log(room)
    } catch (err) {
      Logger.error(err)
      return socket.emit(ESocketMessage.Message, `操作失败，请稍后再试！`)
    }
  }
  @SubscribeMessage(ESocketMessage.PeerConn)
  async connInit(@MessageBody() socketId: string, @ConnectedSocket() socket: ISocketWithAuth) {
    socket.to(socketId).emit(ESocketMessage.PeerConn, socket.id);
  }

  @SubscribeMessage(ESocketMessage.Signal)
  async signal(@MessageBody() info: ISignalData, @ConnectedSocket() socket: ISocketWithAuth) {
    const { socketId, signal } = info;
    const signalingData = { signal, socketId: socket.id };
    socket.to(socketId).emit(ESocketMessage.Signal, signalingData);
  }
}
