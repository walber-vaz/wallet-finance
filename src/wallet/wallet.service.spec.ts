import { WalletService } from './wallet.service';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../entities/transaction.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

jest.mock('typeorm');

const mockWallet = {
  id: randomUUID(),
  balance: 1000,
  userId: randomUUID(),
  user: {
    id: randomUUID(),
    name: 'Test User',
    email: 'test@example.com',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTransaction = {
  id: randomUUID(),
  fromUserId: randomUUID(),
  toUserId: randomUUID(),
  amount: 100,
  description: 'Depósito na carteira',
  type: TransactionType.DEPOSIT,
  status: TransactionStatus.COMPLETED,
  createdAt: new Date(),
};

const mockWalletRepository = {
  findOne: jest.fn(),
};

const mockTransactionRepository = {
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(),
};

const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getRawOne: jest.fn(),
  getOne: jest.fn(),
};

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  },
};

const mockDataSource = {
  createQueryRunner: jest.fn(() => mockQueryRunner),
};

describe('WalletService Tests', () => {
  let service: WalletService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WalletService(
      mockWalletRepository as unknown as Repository<Wallet>,
      mockTransactionRepository as unknown as Repository<Transaction>,
      mockDataSource as unknown as DataSource,
    );
  });

  describe('getWalletByUserId', () => {
    it('should return wallet info if found', async () => {
      mockWalletRepository.findOne.mockResolvedValue({ ...mockWallet });
      const result = await service.getWalletByUserId(mockWallet.userId);
      expect(result).toEqual({
        id: mockWallet.id,
        balance: mockWallet.balance,
        userId: mockWallet.userId,
        user: mockWallet.user,
        createdAt: mockWallet.createdAt,
        updatedAt: mockWallet.updatedAt,
      });
    });

    it('should throw NotFoundException if wallet not found', async () => {
      mockWalletRepository.findOne.mockResolvedValue(null);
      await expect(
        service.getWalletByUserId(mockWallet.userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBalance', () => {
    it('should return balance if wallet found', async () => {
      mockWalletRepository.findOne.mockResolvedValue({ balance: 500 });
      const result = await service.getBalance(mockWallet.userId);
      expect(result).toBe(500);
    });

    it('should throw NotFoundException if wallet not found', async () => {
      mockWalletRepository.findOne.mockResolvedValue(null);
      await expect(service.getBalance(mockWallet.userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getWalletStats', () => {
    it('should return wallet stats', async () => {
      mockWalletRepository.findOne.mockResolvedValue({ balance: 1000 });
      mockTransactionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ total: '200', count: '2' })
        .mockResolvedValueOnce({ total: '100', count: '1' });

      mockQueryBuilder.getOne.mockResolvedValue({
        createdAt: new Date('2024-06-05'),
      });

      const result = await service.getWalletStats(mockWallet.userId);
      expect(result).toEqual({
        currentBalance: 1000,
        totalReceived: 200,
        totalSent: 100,
        totalTransactions: 3,
        lastTransactionDate: new Date('2024-06-05'),
      });
    });

    it('should handle null values in queries', async () => {
      mockWalletRepository.findOne.mockResolvedValue({ balance: 1000 });
      mockTransactionRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder,
      );

      mockQueryBuilder.getRawOne
        .mockResolvedValueOnce({ total: null, count: null }) // receivedQuery
        .mockResolvedValueOnce({ total: null, count: null }); // sentQuery

      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await service.getWalletStats(mockWallet.userId);
      expect(result).toEqual({
        currentBalance: 1000,
        totalReceived: 0,
        totalSent: 0,
        totalTransactions: 0,
        lastTransactionDate: null,
      });
    });

    it('should throw NotFoundException if wallet not found', async () => {
      mockWalletRepository.findOne.mockResolvedValue(null);
      await expect(service.getWalletStats(mockWallet.userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addBalance', () => {
    it('should add balance and return operation response', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue({ balance: 1000 });
      mockQueryRunner.manager.create.mockReturnValue(mockTransaction);
      mockQueryRunner.manager.save.mockResolvedValue(mockTransaction);
      mockQueryRunner.manager.update.mockResolvedValue(undefined);

      const dto = { amount: 100, description: 'Depósito' };
      const result = await service.addBalance(mockWallet.userId, dto);

      expect(result).toMatchObject({
        transactionId: mockTransaction.id,
        operation: 'deposit',
        amount: 100,
        previousBalance: 1000,
        newBalance: 1100,
        description: 'Depósito',
        createdAt: mockTransaction.createdAt,
      });
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException if wallet not found', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(null);
      const dto = { amount: 100, description: 'Depósito' };
      await expect(service.addBalance(mockWallet.userId, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      mockQueryRunner.manager.findOne.mockRejectedValue(new Error('DB error'));
      const dto = { amount: 100, description: 'Depósito' };
      await expect(service.addBalance(mockWallet.userId, dto)).rejects.toThrow(
        'DB error',
      );
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('withdrawBalance', () => {
    it('should withdraw balance and return operation response', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue({ balance: 1000 });
      mockQueryRunner.manager.create.mockReturnValue({
        ...mockTransaction,
        type: TransactionType.WITHDRAWAL,
        description: 'Saque',
      });
      mockQueryRunner.manager.save.mockResolvedValue({
        ...mockTransaction,
        type: TransactionType.WITHDRAWAL,
        description: 'Saque',
      });
      mockQueryRunner.manager.update.mockResolvedValue(undefined);

      const dto = { amount: 200, description: 'Saque' };
      const result = await service.withdrawBalance(mockWallet.userId, dto);

      expect(result).toMatchObject({
        transactionId: mockTransaction.id,
        operation: 'withdrawal',
        amount: 200,
        previousBalance: 1000,
        newBalance: 800,
        description: 'Saque',
        createdAt: mockTransaction.createdAt,
      });
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw NotFoundException if wallet not found', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(null);
      const dto = { amount: 100, description: 'Saque' };
      await expect(
        service.withdrawBalance(mockWallet.userId, dto),
      ).rejects.toThrow(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException if insufficient balance', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue({ balance: 50 });
      const dto = { amount: 100, description: 'Saque' };
      await expect(
        service.withdrawBalance(mockWallet.userId, dto),
      ).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      mockQueryRunner.manager.findOne.mockRejectedValue(new Error('DB error'));
      const dto = { amount: 100, description: 'Saque' };
      await expect(
        service.withdrawBalance(mockWallet.userId, dto),
      ).rejects.toThrow('DB error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });
});
