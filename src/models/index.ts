import { Request } from 'express'
import { Socket } from 'socket.io'

export enum ESocketMessage {
  Connect = 'connect',
  Disconnect = 'disconnect',
  Joined = 'joined',
  Leaved = 'leaved',

  Join = 'join',
  Create = 'create',
  Match = 'match',
  Message = 'message',
  Offer = 'offer',
  Answer = 'answer',
  Ice = 'ice',

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
  socketId: string
}
export interface IRequestWithAuth extends Request {
  user: IUser
}

export interface ISocketWithAuth extends Socket {
  user: IUser
}

export interface IRoom {
  roomId: string
  roomName: string
  users: {[key:string]: IUser }
  // users: IUser[]
}

export type SignalData =
  | {
  type: "transceiverRequest";
  transceiverRequest: {
    kind: string;
    init?: RTCRtpTransceiverInit | undefined;
  };
}
  | {
  type: "renegotiate";
  renegotiate: true;
}
  | {
  type: "candidate";
  candidate: RTCIceCandidate;
}
  | RTCSessionDescriptionInit;