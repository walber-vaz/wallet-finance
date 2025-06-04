import {
  IsUUID,
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  TransactionStatus,
  TransactionType,
} from '../../entities/transaction.entity';

export class CreateTransferDto {
  @ApiProperty({
    description: 'ID único do usuário destinatário da transferência',
    example: '456e7890-e12b-34c5-d678-901234567890',
    format: 'uuid',
  })
  @IsUUID()
  toUserId: string;

  @ApiProperty({
    description: 'Valor da transferência em reais (máximo 2 casas decimais)',
    example: 250.75,
    type: 'number',
    format: 'decimal',
    minimum: 0.01,
    maximum: 999999.99,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: 'Descrição opcional da transferência',
    example: 'Pagamento do almoço no restaurante',
    required: false,
    maxLength: 255,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

export class TransactionResponseDto {
  @ApiProperty({
    description: 'ID único da transação',
    example: 'abc12345-f678-90gh-ij12-345678901234',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Valor da transação em reais',
    example: 250.75,
    type: 'number',
    format: 'decimal',
  })
  amount: number;

  @ApiProperty({
    description: 'Tipo da transação',
    enum: TransactionType,
    example: TransactionType.TRANSFER,
    enumName: 'TransactionType',
  })
  type: TransactionType;

  @ApiProperty({
    description: 'Status atual da transação',
    enum: TransactionStatus,
    example: TransactionStatus.COMPLETED,
    enumName: 'TransactionStatus',
  })
  status: TransactionStatus;

  @ApiProperty({
    description: 'Descrição da transação',
    example: 'Pagamento do almoço no restaurante',
  })
  description: string;

  @ApiProperty({
    description: 'ID do usuário remetente',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  fromUserId: string;

  @ApiProperty({
    description: 'ID do usuário destinatário',
    example: '456e7890-e12b-34c5-d678-901234567890',
    format: 'uuid',
  })
  toUserId: string;

  @ApiProperty({
    description: 'Dados do usuário remetente',
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID do remetente',
        example: '123e4567-e89b-12d3-a456-426614174000',
      },
      name: {
        type: 'string',
        description: 'Nome do remetente',
        example: 'João Silva Santos',
      },
      email: {
        type: 'string',
        description: 'Email do remetente',
        example: 'joao.silva@email.com',
      },
    },
  })
  fromUser: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({
    description: 'Dados do usuário destinatário',
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID do destinatário',
        example: '456e7890-e12b-34c5-d678-901234567890',
      },
      name: {
        type: 'string',
        description: 'Nome do destinatário',
        example: 'Maria Santos Silva',
      },
      email: {
        type: 'string',
        description: 'Email do destinatário',
        example: 'maria.santos@email.com',
      },
    },
  })
  toUser: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({
    description: 'Data e hora de criação da transação',
    example: '2025-06-04T14:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;
}

export class TransactionHistoryDto {
  @ApiProperty({
    description: 'ID único da transação',
    example: 'abc12345-f678-90gh-ij12-345678901234',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Valor da transação em reais',
    example: 250.75,
    type: 'number',
    format: 'decimal',
  })
  amount: number;

  @ApiProperty({
    description: 'Tipo da transação',
    enum: TransactionType,
    example: TransactionType.TRANSFER,
    enumName: 'TransactionType',
  })
  type: TransactionType;

  @ApiProperty({
    description: 'Status atual da transação',
    enum: TransactionStatus,
    example: TransactionStatus.COMPLETED,
    enumName: 'TransactionStatus',
  })
  status: TransactionStatus;

  @ApiProperty({
    description: 'Descrição da transação',
    example: 'Pagamento do almoço no restaurante',
  })
  description: string;

  @ApiProperty({
    description:
      'Indica se a transação foi recebida (true) ou enviada (false) pelo usuário',
    example: false,
    type: 'boolean',
  })
  isIncoming: boolean;

  @ApiProperty({
    description: 'Dados da outra parte envolvida na transação',
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID do outro usuário',
        example: '456e7890-e12b-34c5-d678-901234567890',
      },
      name: {
        type: 'string',
        description: 'Nome do outro usuário',
        example: 'Maria Santos Silva',
      },
      email: {
        type: 'string',
        description: 'Email do outro usuário',
        example: 'maria.santos@email.com',
      },
    },
  })
  otherUser: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({
    description: 'Data e hora de criação da transação',
    example: '2025-06-04T14:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;
}
