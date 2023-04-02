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
