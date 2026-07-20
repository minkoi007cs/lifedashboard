import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getStats() {
    const totalUsers = await this.usersRepository.count();
    return {
      totalUsers,
      systemHealth: 'Healthy',
    };
  }
}
