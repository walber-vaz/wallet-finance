import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { User } from '../entities/user.entity';
import { Wallet } from '../entities/wallet.entity';
import { Transaction } from '../entities/transaction.entity';

config();

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: configService.get('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_DATABASE'),
  entities: [User, Wallet, Transaction],
  migrations: [
    configService.get('NODE_ENV') === 'production'
      ? 'dist/migrations/*.js'
      : 'src/migrations/*.ts',
  ],
  migrationsTableName: 'migrations',
  synchronize: false,
});
