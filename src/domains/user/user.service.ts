import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Creates a new user
   *
   * @param email email of the user to create
   * @returns created user
   * @throws {ConflictException} If a user with this email already exists
   */
  async createUser(email: string): Promise<User> {
    const existingUser = await this.userRepository.findOneBy({ email });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const newUser = this.userRepository.create({ email });
    return await this.userRepository.save(newUser);
  }

  /**
   * Retrieves an existing user by email or creates a new user if not found
   *
   * @param email email of user to search or create
   * @returns The found or created user
   */
  async createUserIfNotExists(email: string): Promise<User> {
    const user = await this.userRepository.findOneBy({ email });

    if (user) {
      return user;
    }

    return this.createUser(email);
  }
}
