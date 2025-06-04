import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import type { WalletStatsDto } from './dto/wallet.dto';
import {
  Transaction,
  TransactionType,
  TransactionStatus,
} from '../entities/transaction.entity';
import {
  AddBalanceDto,
  WithdrawBalanceDto,
  BalanceOperationResponseDto,
} from './dto/wallet-operation.dto';

export interface WalletInfo {
  id: string;
  balance: number;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly dataSource: DataSource,
  ) {}

  async getWalletByUserId(userId: string): Promise<WalletInfo> {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!wallet) {
      throw new NotFoundException('Carteira não encontrada');
    }

    return {
      id: wallet.id,
      balance: Number(wallet.balance),
      userId: wallet.userId,
      user: {
        id: wallet.user.id,
        name: wallet.user.name,
        email: wallet.user.email,
      },
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  async getBalance(userId: string): Promise<number> {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Carteira não encontrada');
    }

    return Number(wallet.balance);
  }

  async getWalletStats(userId: string): Promise<WalletStatsDto> {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Carteira não encontrada');
    }

    const receivedQuery = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'total')
      .addSelect('COUNT(transaction.id)', 'count')
      .where('transaction.toUserId = :userId', { userId })
      .andWhere('transaction.status = :status', { status: 'completed' })
      .getRawOne<{ total: string | null; count: string | null }>();

    const sentQuery = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'total')
      .addSelect('COUNT(transaction.id)', 'count')
      .where('transaction.fromUserId = :userId', { userId })
      .andWhere('transaction.status = :status', { status: 'completed' })
      .getRawOne<{ total: string | null; count: string | null }>();

    const lastTransaction = await this.transactionRepository
      .createQueryBuilder('transaction')
      .where(
        '(transaction.fromUserId = :userId OR transaction.toUserId = :userId)',
        { userId },
      )
      .andWhere('transaction.status = :status', { status: 'completed' })
      .orderBy('transaction.createdAt', 'DESC')
      .getOne();

    const totalReceived = Number(receivedQuery?.total || 0);
    const totalSent = Number(sentQuery?.total || 0);
    const receivedCount = Number(receivedQuery?.count || 0);
    const sentCount = Number(sentQuery?.count || 0);

    return {
      currentBalance: Number(wallet.balance),
      totalReceived,
      totalSent,
      totalTransactions: receivedCount + sentCount,
      lastTransactionDate: lastTransaction?.createdAt || null,
    };
  }

  async addBalance(
    userId: string,
    addBalanceDto: AddBalanceDto,
  ): Promise<BalanceOperationResponseDto> {
    const { amount, description } = addBalanceDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('Carteira não encontrada');
      }

      const previousBalance = Number(wallet.balance);

      const transaction = queryRunner.manager.create(Transaction, {
        fromUserId: userId,
        toUserId: userId,
        amount,
        description: description || 'Depósito na carteira',
        type: TransactionType.DEPOSIT,
        status: TransactionStatus.COMPLETED,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      await queryRunner.manager.update(
        Wallet,
        { userId },
        { balance: () => `balance + ${amount}` },
      );

      await queryRunner.commitTransaction();

      const newBalance = previousBalance + amount;

      return {
        transactionId: savedTransaction.id,
        operation: 'deposit',
        amount,
        previousBalance,
        newBalance,
        description: transaction.description,
        createdAt: savedTransaction.createdAt,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async withdrawBalance(
    userId: string,
    withdrawBalanceDto: WithdrawBalanceDto,
  ): Promise<BalanceOperationResponseDto> {
    const { amount, description } = withdrawBalanceDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new NotFoundException('Carteira não encontrada');
      }

      const previousBalance = Number(wallet.balance);

      if (previousBalance < amount) {
        throw new BadRequestException(
          `Saldo insuficiente para saque. Saldo atual: R$ ${previousBalance.toFixed(2)}`,
        );
      }

      const transaction = queryRunner.manager.create(Transaction, {
        fromUserId: userId,
        toUserId: userId,
        amount,
        description: description || 'Saque da carteira',
        type: TransactionType.WITHDRAWAL,
        status: TransactionStatus.COMPLETED,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      await queryRunner.manager.update(
        Wallet,
        { userId },
        { balance: () => `balance - ${amount}` },
      );

      await queryRunner.commitTransaction();

      const newBalance = previousBalance - amount;

      return {
        transactionId: savedTransaction.id,
        operation: 'withdrawal',
        amount,
        previousBalance,
        newBalance,
        description: transaction.description,
        createdAt: savedTransaction.createdAt,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
