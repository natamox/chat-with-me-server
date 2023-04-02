import { Request } from 'express'
import { Socket } from 'socket.io'

export enum ESocketMessage {
  /** 状态 */
  Connect = 'connect',
  Disconnect = 'disconnect',
  Joined = 'joined',
  Leaved = 'leaved',

  /**行为 */
  Join = 'join',
  Create = 'create',
  Match = 'match',
  Message = 'message'
}

export interface IUser {
  id: string
  username: string
}
export interface IRequestWithAuth extends Request {
  user: IUser
}

export interface ISocketWithAuth extends Socket {
  user: IUser
}
