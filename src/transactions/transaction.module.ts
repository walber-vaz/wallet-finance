import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transaction.service';
import { TransactionsController } from './transaction.controller';
import { Transaction } from '../entities/transaction.entity';
import { User } from '../entities/user.entity';
import { Wallet } from '../entities/wallet.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, User, Wallet])],
  providers: [TransactionsService],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
