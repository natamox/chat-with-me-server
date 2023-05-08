import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import * as bcrypt from 'bcryptjs'
import { User } from './entities/user.entity'
import { PrismaService } from '@database/prisma.service'
import { RedisService } from '@database/redis.service'

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService
  ) {}
  async register({ username, password, nickname }: CreateUserDto) {
    const existUser = await this.prismaService.user.findUnique({ where: { username } })
    if (existUser) {
      throw new HttpException('用户名已存在', HttpStatus.BAD_REQUEST)
    }
    const hashPassword = bcrypt.hashSync(password, 10)
    const user = await this.prismaService.user.create({
      data: { username, nickname, password: hashPassword }
    })
    delete user.password
    return { user: user }
  }

  async login({ username, password }: CreateUserDto) {
    const user = await this.prismaService.user.findUnique({ where: { username } })
    if (!user) throw new HttpException('用户不存在！', HttpStatus.BAD_REQUEST)
    const isOk = bcrypt.compareSync(password, user.password)
    if (!isOk) throw new HttpException('密码错误！', HttpStatus.BAD_REQUEST)
    const token = await this.token(user)
    delete user.password
    delete user.createdAt
    delete user.updatedAt
    this.redisService.set(`user:${user.id}`, JSON.stringify(user))
    return { user, ...token }
  }

  // 获取token
  async token({ id, username }: User) {
    return {
      token: await this.jwtService.signAsync({
        username: username,
        sub: id
      })
    }
  }

  // update(id: number, updateUserDto: UpdateUserDto) {
  //   return `This action updates a #${id} user`
  // }
}
