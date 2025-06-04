import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from '../entities/transaction.entity';
import { User } from '../entities/user.entity';
import { Wallet } from '../entities/wallet.entity';
import {
  CreateTransferDto,
  TransactionResponseDto,
  TransactionHistoryDto,
} from './dto/transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    private readonly dataSource: DataSource,
  ) {}

  async transfer(
    fromUserId: string,
    transferDto: CreateTransferDto,
  ): Promise<TransactionResponseDto> {
    const { toUserId, amount, description } = transferDto;

    if (fromUserId === toUserId) {
      throw new BadRequestException('Não é possível transferir para si mesmo');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const fromUser = await queryRunner.manager.findOne(User, {
        where: { id: fromUserId },
      });

      const toUser = await queryRunner.manager.findOne(User, {
        where: { id: toUserId },
      });

      if (!fromUser) {
        throw new NotFoundException('Usuário remetente não encontrado');
      }

      if (!toUser) {
        throw new NotFoundException('Usuário destinatário não encontrado');
      }

      const fromWallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId: fromUserId },
        lock: { mode: 'pessimistic_write' },
      });

      const toWallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId: toUserId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!fromWallet) {
        throw new NotFoundException('Carteira do remetente não encontrada');
      }

      if (!toWallet) {
        throw new NotFoundException('Carteira do destinatário não encontrada');
      }

      if (Number(fromWallet.balance) < amount) {
        throw new BadRequestException(
          `Saldo insuficiente. Saldo atual: R$ ${Number(fromWallet.balance).toFixed(2)}`,
        );
      }

      const transaction = queryRunner.manager.create(Transaction, {
        fromUserId,
        toUserId,
        amount,
        description: description || `Transferência para ${toUser.name}`,
        type: TransactionType.TRANSFER,
        status: TransactionStatus.PENDING,
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      await queryRunner.manager.update(
        Wallet,
        { userId: fromUserId },
        { balance: () => `balance - ${amount}` },
      );

      await queryRunner.manager.update(
        Wallet,
        { userId: toUserId },
        { balance: () => `balance + ${amount}` },
      );

      await queryRunner.manager.update(
        Transaction,
        { id: savedTransaction.id },
        { status: TransactionStatus.COMPLETED },
      );

      await queryRunner.commitTransaction();

      const completedTransaction = await this.transactionRepository.findOne({
        where: { id: savedTransaction.id },
        relations: ['fromUser', 'toUser'],
      });

      return this.formatTransactionResponse(completedTransaction!);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async reverseTransaction(
    transactionId: string,
    userId: string,
  ): Promise<TransactionResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const originalTransaction = await queryRunner.manager.findOne(
        Transaction,
        {
          where: { id: transactionId },
          relations: ['fromUser', 'toUser'],
        },
      );

      if (!originalTransaction) {
        throw new NotFoundException('Transação não encontrada');
      }

      if (
        originalTransaction.fromUserId !== userId &&
        originalTransaction.toUserId !== userId
      ) {
        throw new ForbiddenException(
          'Você não tem permissão para reverter esta transação',
        );
      }

      if (originalTransaction.status === TransactionStatus.REVERSED) {
        throw new BadRequestException('Esta transação já foi revertida');
      }

      if (originalTransaction.status !== TransactionStatus.COMPLETED) {
        throw new BadRequestException(
          'Apenas transações completadas podem ser revertidas',
        );
      }

      const fromWallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId: originalTransaction.fromUserId },
        lock: { mode: 'pessimistic_write' },
      });

      const toWallet = await queryRunner.manager.findOne(Wallet, {
        where: { userId: originalTransaction.toUserId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!fromWallet || !toWallet) {
        throw new NotFoundException('Carteira do usuário não encontrada');
      }

      if (Number(toWallet.balance) < Number(originalTransaction.amount)) {
        throw new BadRequestException(
          'Destinatário não possui saldo suficiente para reversão',
        );
      }

      const reversalTransaction = queryRunner.manager.create(Transaction, {
        fromUserId: originalTransaction.toUserId,
        toUserId: originalTransaction.fromUserId,
        amount: originalTransaction.amount,
        description: `Reversão da transação ${originalTransaction.id}`,
        type: TransactionType.REVERSAL,
        status: TransactionStatus.PENDING,
      });

      const savedReversal = await queryRunner.manager.save(reversalTransaction);

      await queryRunner.manager.update(
        Wallet,
        { userId: originalTransaction.toUserId },
        { balance: () => `balance - ${originalTransaction.amount}` },
      );

      await queryRunner.manager.update(
        Wallet,
        { userId: originalTransaction.fromUserId },
        { balance: () => `balance + ${originalTransaction.amount}` },
      );

      await queryRunner.manager.update(
        Transaction,
        { id: originalTransaction.id },
        {
          status: TransactionStatus.REVERSED,
          reversalTransactionId: savedReversal.id,
        },
      );

      await queryRunner.manager.update(
        Transaction,
        { id: savedReversal.id },
        { status: TransactionStatus.COMPLETED },
      );

      await queryRunner.commitTransaction();

      const completedReversal = await this.transactionRepository.findOne({
        where: { id: savedReversal.id },
        relations: ['fromUser', 'toUser'],
      });

      return this.formatTransactionResponse(completedReversal!);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getTransactionHistory(
    userId: string,
  ): Promise<TransactionHistoryDto[]> {
    const transactions = await this.transactionRepository.find({
      where: [{ fromUserId: userId }, { toUserId: userId }],
      relations: ['fromUser', 'toUser'],
      order: { createdAt: 'DESC' },
    });

    return transactions.map((transaction) =>
      this.formatTransactionHistory(transaction, userId),
    );
  }

  async getTransactionById(
    transactionId: string,
    userId: string,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
      relations: ['fromUser', 'toUser'],
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    if (transaction.fromUserId !== userId && transaction.toUserId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para ver esta transação',
      );
    }

    return this.formatTransactionResponse(transaction);
  }

  private formatTransactionResponse(
    transaction: Transaction,
  ): TransactionResponseDto {
    return {
      id: transaction.id,
      amount: Number(transaction.amount),
      type: transaction.type,
      status: transaction.status,
      description: transaction.description,
      fromUserId: transaction.fromUserId,
      toUserId: transaction.toUserId,
      fromUser: {
        id: transaction.fromUser.id,
        name: transaction.fromUser.name,
        email: transaction.fromUser.email,
      },
      toUser: {
        id: transaction.toUser.id,
        name: transaction.toUser.name,
        email: transaction.toUser.email,
      },
      createdAt: transaction.createdAt,
    };
  }

  private formatTransactionHistory(
    transaction: Transaction,
    userId: string,
  ): TransactionHistoryDto {
    const isIncoming = transaction.toUserId === userId;
    const otherUser = isIncoming ? transaction.fromUser : transaction.toUser;

    return {
      id: transaction.id,
      amount: Number(transaction.amount),
      type: transaction.type,
      status: transaction.status,
      description: transaction.description,
      isIncoming,
      otherUser: {
        id: otherUser.id,
        name: otherUser.name,
        email: otherUser.email,
      },
      createdAt: transaction.createdAt,
    };
  }
}
