import { ISocketWithAuth } from '@models'

export interface IRoom {
  roomName: string
  users: ISocketWithAuth['user'][]
}
