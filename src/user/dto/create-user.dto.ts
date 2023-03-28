import { IsNotEmpty, MaxLength } from 'class-validator'

export class CreateUserDto {
  @MaxLength(20, { message: '用户名最多20字！' })
  @IsNotEmpty({ message: '用户名不能为空！' })
  username: string
  @IsNotEmpty({ message: '密码不能为空！' })
  password: string
}
