import { Request } from 'express'
import { Socket } from 'socket.io'

export enum ESocketMessage {
  Connect = 'connect',
  Disconnect = 'disconnect',
  Leaved = 'leaved',
  Joined = 'joined',

  Join = 'join',
  Leave = 'leave',
  Create = 'create',
  Match = 'match',
  Message = 'message',

  OpenCamera = 'openCamera',
  CloseCamera = 'closeCamera',

  Signal = 'signal',
  Stream = 'stream',

  PeerRequest = 'connPre',

  PeerConn = 'connInit',

  Info = 'info',
  Warn = 'warn'
}

export interface IUser {
  id: string
  username: string
  nickname: string
}

export interface IRoomUser extends IUser {
  socketId: string
  isCameraOpen: boolean
}

export interface IMessage {
  id: string
  user: IRoomUser
  text: string
  time: string
}
export interface IRequestWithAuth extends Request {
  user: IUser
}

export interface ISocketWithAuth extends Socket {
  user: IUser
}

export enum ERoomType {
  Math = 'math',
  Chat = 'chat'
}

export interface IRoom {
  roomId: string
  roomName: string
  type: ERoomType
  users: { [key: string]: IRoomUser }
  message: IMessage[]
}

export type SignalData =
  | {
      type: 'transceiverRequest'
      transceiverRequest: {
        kind: string
        init?: RTCRtpTransceiverInit | undefined
      }
    }
  | {
      type: 'renegotiate'
      renegotiate: true
    }
  | {
      type: 'candidate'
      candidate: RTCIceCandidate
    }
  | RTCSessionDescriptionInit
