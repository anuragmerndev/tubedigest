import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async syncUser(clerkId: string, email: string): Promise<User> {
    const existing = await this.userRepo.findOne({ where: { clerkId } });

    if (existing) {
      existing.email = email;
      return this.userRepo.save(existing);
    }

    const user = this.userRepo.create({ clerkId, email });
    return this.userRepo.save(user);
  }

  async deleteUser(clerkId: string): Promise<void> {
    await this.userRepo.delete({ clerkId });
  }
}
