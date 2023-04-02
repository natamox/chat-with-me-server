import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/core/filter/http-exception.filter'
import { TransformInterceptor } from './common/core/interceptor/transform.interceptor'
import { toNumber } from 'lodash'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalInterceptors(new TransformInterceptor())
  app.useGlobalPipes(new ValidationPipe())
  app.setGlobalPrefix(process.env.BASE_API || 'api')
  app.enableCors()

  await app.listen(toNumber(process.env.SERVER_PORT || 3000))
}

bootstrap()
