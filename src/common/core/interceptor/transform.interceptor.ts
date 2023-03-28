import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { map } from 'rxjs/operators'

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((data) => {
        let result: any = {}
        /**如果返回的就是一个数组则加上items字段 */
        data instanceof Array ? (result.items = data) : (result = data)
        const res = {
          code: 200,
          data: result,
          message: 'success'
        }
        return res
      })
    )
  }
}
