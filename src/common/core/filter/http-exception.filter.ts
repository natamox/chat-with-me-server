import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common'
import { Logger } from 'nest-logs'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp() // 获取请求上下文
    const response = ctx.getResponse() // 获取请求上下文中的 response对象
    const request = ctx.getRequest() // 获取请求上下文中的 request
    const status = exception.getStatus() // 获取异常状态码
    let error: any
    if (typeof exception.getResponse() === 'object') {
      const obj: any = exception.getResponse()
      error = obj.message instanceof Array ? obj.message.join('，') : obj.message
    } else {
      error = exception.message
    }
    const errorResponse = {
      code: status,
      message: error,
      path: request.url,
      timestamp: new Date().toLocaleString()
    }
    Logger.error(errorResponse)
    delete errorResponse.path
    // 设置返回的状态码， 请求头，发送错误信息
    response.status(status)
    response.header('Content-Type', 'application/json; charset=utf-8')
    response.send(errorResponse)
  }
}
