import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto'
import { LoginInput, LoginOutput } from './dtos/login.dto'
import { User } from './entities/user.entity'
import { JwtService } from 'src/jwt/jwt.service'
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto'
import { Verification } from './entities/verification.entity'
import { UserProfileOutput } from 'src/users/dtos/user-profile.dto'
import { VerifyEmailOutput } from 'src/users/dtos/verify-email.dto'
import { MailService } from 'src/mail/mail.service'
import errorMessages from '../common/error-messages.constants'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verification: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const existingUser = await this.users.findOne({
        where: { email },
      })
      if (existingUser) {
        return { ok: false, error: errorMessages.user.emailExisting }
      }
      const user = await this.users.save(
        this.users.create({ email, password, role }),
      )
      const verification = await this.verification.save(
        this.verification.create({
          user,
        }),
      )
      this.mailService.sendVerificationEmail(
        user.email,
        verification.code,
        'geony@signpod.co.kr',
      )
      return { ok: true }
    } catch (err) {
      return { ok: false, error: "couldn't create account" }
    }
  }
  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.users.findOne({
        where: { email },
        select: ['id', 'password'],
      })
      if (!user) {
        return {
          ok: false,
          error: errorMessages.user.userNotFound,
        }
      }
      const passwordCorrect = await user.checkPassword(password)
      if (!passwordCorrect) {
        return {
          ok: false,
          error: errorMessages.user.passwordWrong,
        }
      }
      const token = this.jwtService.sign(user.id)
      return {
        ok: true,
        token,
      }
    } catch (error) {
      return {
        ok: false,
        error,
      }
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOneByOrFail({
        id,
      })
      return {
        ok: true,
        user,
      }
    } catch (error) {
      console.error(error)
      return {
        ok: false,
        error: errorMessages.user.userNotFound,
      }
    }
  }

  async editProfile(
    userId: number,
    { email, password }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const user = await this.users.findOne({
        where: { id: userId },
        select: ['id', 'password', 'email', 'verified'],
      })
      if (!user)
        return {
          ok: false,
          error: errorMessages.user.userNotFound,
        }
      if (email) {
        const existingUser = await this.users.findOne({ where: { email } })
        if (existingUser)
          return {
            ok: false,
            error: errorMessages.user.emailExisting,
          }
        user.email = email
        user.verified = false
        await this.verification.delete({ user: { id: userId } })
        const verification = await this.verification.save(
          this.verification.create({ user }),
        )
        this.mailService.sendVerificationEmail(
          user.email,
          verification.code,
          'geony@signpod.co.kr',
        )
      }
      if (password) {
        user.password = password
      }
      await this.users.save(user)
      return {
        ok: true,
      }
    } catch (error) {
      console.error(error)
      return {
        ok: false,
        error: 'Could not update profile.',
      }
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verification.findOne({
        where: { code },
        relations: ['user'],
      })
      if (verification) {
        verification.user.verified = true
        this.users.save(verification.user)
        await this.verification.delete(verification.id)
        return {
          ok: true,
        }
      }
      return {
        ok: false,
        error: 'verification not found',
      }
    } catch (error) {
      console.error(error)
      return {
        ok: false,
        error,
      }
    }
  }
}
