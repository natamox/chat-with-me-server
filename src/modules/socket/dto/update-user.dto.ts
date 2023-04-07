import { SignalData } from '@models'

export interface ITransferOffer {
  offer: RTCSessionDescriptionInit
  roomId: string
}

export interface ITransferAnswer {
  answer: RTCSessionDescriptionInit
  roomId: string
}

export interface ISignalData {
  signal: SignalData
  socketId: string
}
