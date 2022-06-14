import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAccountInput } from './dtos/create-account.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<string | undefined> {
    // check new user
    try {
      const existingUser = await this.users.findOne({ where: { email } });
      if (existingUser) {
        return 'user exists';
      }
      await this.users.save(this.users.create({ email, password, role }));
    } catch (err) {
      return "couldn't create account";
    }
  }
}
