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
import { ESocketMessage, IMessage, IRoomUser, ISocketWithAuth, IUser, SignalData } from '@models'
import { RedisService } from '@database/redis.service'
import { Server } from 'socket.io'
import { cloneDeep, values } from 'lodash'
import { RoomService } from '@modules/room/room.service'

@UseGuards(JwtAuthGuard)
@WebSocketGateway({ cors: true })
export class SocketGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  constructor(private readonly redisService: RedisService, private readonly roomService: RoomService) {}

  // handleConnection(@ConnectedSocket() socket: ISocketWithAuth) {}

  async handleDisconnect(@ConnectedSocket() socket: ISocketWithAuth) {
    const roomId = await this.redisService.getUserStatus(socket.user?.id)
    if (!roomId) return
    await this.leaveRoom(roomId, socket)
  }

  @SubscribeMessage(ESocketMessage.Message)
  async message(
    @MessageBody() detail: { message: IMessage; roomId: string },
    @ConnectedSocket() socket: ISocketWithAuth
  ) {
    await this.roomService.updateRoomMessage(detail.roomId, detail.message)
    socket.to(detail.roomId).emit(ESocketMessage.Message, detail.message)
  }

  @SubscribeMessage(ESocketMessage.Join)
  async joinRoom(@MessageBody() roomId: string, @ConnectedSocket() socket: ISocketWithAuth) {
    const join = async () => {
      try {
        const room = await this.roomService.findRoom(roomId)
        if (!room) return socket.emit(ESocketMessage.Warn, `未找到该房间！`)
        const roomUsersObj = JSON.parse(room.users)
        const messages = JSON.parse(room.message)
        room.users = roomUsersObj
        room.message = messages
        const usersArr: IRoomUser[] = values(roomUsersObj)
        if (usersArr.length === 4) return socket.emit(ESocketMessage.Warn, `房间人数已满！`)

        const user = cloneDeep(socket.user)
        user['socketId'] = socket.id
        roomUsersObj[user.id] = user
        await this.roomService.updateRoomUsers(roomId, JSON.stringify(roomUsersObj))
        await this.redisService.setUserStatus(user.id, roomId)

        socket.join(roomId)
        // 向自己以及房间内其他人发送加入消息更新房间
        usersArr.push(user as IRoomUser)
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

    while (true) {
      // 加房间锁，防止多人同时加入房间可能会导致的数据不一致
      const lock = await this.redisService.acquireLock(roomId)
      if (lock) {
        await join()
        await this.redisService.releaseLock(roomId)
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  @SubscribeMessage(ESocketMessage.Leave)
  async leaveRoom(@MessageBody() roomId: string, @ConnectedSocket() socket: ISocketWithAuth) {
    const room = await this.roomService.findRoom(roomId)
    const roomUsersObj = JSON.parse(room.users)
    const messages = JSON.parse(room.message)
    room.users = roomUsersObj
    room.message = messages
    delete roomUsersObj[socket.user.id]
    await this.redisService.setUserStatus(socket.user.id, '')
    await this.roomService.updateRoomUsers(roomId, JSON.stringify(roomUsersObj))
    socket.to(roomId).emit(ESocketMessage.Leaved, { room, user: socket.user })
    socket.leave(roomId)
  }

  @SubscribeMessage(ESocketMessage.PeerConn)
  async peerConnect(@MessageBody() socketId: string, @ConnectedSocket() socket: ISocketWithAuth) {
    socket.user['socketId'] = socket.id
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
