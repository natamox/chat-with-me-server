type app = {
  tokenSecret: string
}
type wx = {
  key: {
    accessTokenParams: {
      appID: string
      appsecret: string
    }
    templateId: string
  }
  api: {
    accessToken: string
    postMessage: string
  }
}
type weather = {
  key: string
  api: {
    threeDaysWeather: string
    weatherDetail: string
  }
}

export type LogLevel = 'info' | 'query' | 'warn' | 'error'
export type LogDefinition = {
  level: LogLevel
  emit: 'stdout' | 'event'
}

export type QueryEvent = {
  timestamp: Date
  query: string // 发送到数据库的查询
  params: string // 查询参数
  duration: number // 客户端发送查询到数据库的时间间隔 - 不仅是执行查询所需的时间
  target: string
}

export type LogEvent = {
  timestamp: Date
  message: string
  target: string
}
