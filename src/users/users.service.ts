import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { Wallet } from '../entities/wallet.entity';
import { CreateUserDto, UserResponseDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, password, name } = createUserDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = queryRunner.manager.create(User, {
        name,
        email,
        password: hashedPassword,
      });

      const savedUser = await queryRunner.manager.save(user);

      const wallet = queryRunner.manager.create(Wallet, {
        userId: savedUser.id,
        balance: 0,
      });

      await queryRunner.manager.save(wallet);

      await queryRunner.commitTransaction();

      return {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        createdAt: savedUser.createdAt,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['wallet'],
    });
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['wallet'],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
