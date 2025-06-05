import { UsersService } from './users.service';
import { Repository, DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Wallet } from '../entities/wallet.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import type { CreateUserDto } from './dto/user.dto';
import { randomUUID } from 'node:crypto';

jest.mock('bcryptjs');

const mockUserRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});
const mockWalletRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
});
const mockQueryRunner = () => ({
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    create: jest.fn(),
    save: jest.fn(),
  },
});
const mockDataSource = () => ({
  createQueryRunner: jest.fn(),
});

describe('UsersService', () => {
  let usersService: UsersService;
  let userRepository: ReturnType<typeof mockUserRepository>;
  let walletRepository: ReturnType<typeof mockWalletRepository>;
  let dataSource: ReturnType<typeof mockDataSource>;
  let queryRunner: ReturnType<typeof mockQueryRunner>;

  beforeEach(() => {
    userRepository = mockUserRepository();
    walletRepository = mockWalletRepository();
    dataSource = mockDataSource();
    queryRunner = mockQueryRunner();
    dataSource.createQueryRunner.mockReturnValue(queryRunner);

    usersService = new UsersService(
      userRepository as unknown as Repository<User>,
      walletRepository as unknown as Repository<Wallet>,
      dataSource as unknown as DataSource,
    );
  });

  describe('Service create method', () => {
    const createUserDto = {
      email: 'test@example.com',
      password: 'SenhaForte123!',
      name: 'Test User',
    };

    it('should throw ConflictException if email already exists', async () => {
      userRepository.findOne.mockResolvedValue({
        id: randomUUID(),
        email: createUserDto.email,
      });
      await expect(
        usersService.create(createUserDto as CreateUserDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user and wallet, commit transaction, and return user response', async () => {
      userRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      const savedUser = {
        id: randomUUID(),
        name: createUserDto.name,
        email: createUserDto.email,
        createdAt: new Date(),
      };
      queryRunner.manager.create
        .mockImplementationOnce(() => ({
          ...savedUser,
          password: 'hashedPassword',
        }))
        .mockImplementationOnce(() => ({ userId: savedUser.id, balance: 0 }));
      queryRunner.manager.save
        .mockImplementationOnce(() => savedUser)
        .mockImplementationOnce((wallet: Wallet) => wallet);

      const result = await usersService.create(createUserDto as CreateUserDto);

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 12);
      expect(queryRunner.manager.create).toHaveBeenCalledWith(
        User,
        expect.objectContaining({
          name: createUserDto.name,
          email: createUserDto.email,
          password: 'hashedPassword',
        }),
      );
      expect(queryRunner.manager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createUserDto.name,
          email: createUserDto.email,
          password: 'hashedPassword',
        }),
      );
      expect(queryRunner.manager.create).toHaveBeenCalledWith(Wallet, {
        userId: savedUser.id,
        balance: 0,
      });
      expect(queryRunner.manager.save).toHaveBeenCalledWith({
        userId: savedUser.id,
        balance: 0,
      });
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
      expect(result).toEqual({
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        createdAt: savedUser.createdAt,
      });
    });

    it('should rollback transaction and throw error if something fails', async () => {
      userRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      queryRunner.manager.create.mockImplementationOnce(() => ({}));
      queryRunner.manager.save.mockImplementationOnce(() => {
        throw new Error('DB error');
      });

      await expect(
        usersService.create(createUserDto as CreateUserDto),
      ).rejects.toThrow('DB error');
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('Service findByEmail method', () => {
    it('should return user with wallet by email', async () => {
      const user = { id: randomUUID(), email: 'test@example.com', wallet: {} };
      userRepository.findOne.mockResolvedValue(user);
      const result = await usersService.findByEmail('test@example.com');
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        relations: ['wallet'],
      });
      expect(result).toBe(user);
    });
  });

  describe('Service findById method', () => {
    it('should return user with wallet by id', async () => {
      const user = { id: randomUUID(), email: 'test@example.com', wallet: {} };
      userRepository.findOne.mockResolvedValue(user);
      const result = await usersService.findById(user.id);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: user.id },
        relations: ['wallet'],
      });
      expect(result).toBe(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);
      await expect(usersService.findById('not-exist')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Service validatePassword method', () => {
    it('should return true if password matches', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      const result = await usersService.validatePassword('plain', 'hashed');
      expect(bcrypt.compare).toHaveBeenCalledWith('plain', 'hashed');
      expect(result).toBe(true);
    });

    it('should return false if password does not match', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      const result = await usersService.validatePassword('plain', 'hashed');
      expect(result).toBe(false);
    });
  });
});
