import { ApiProperty } from '@nestjs/swagger';

export class WalletResponseDto {
  @ApiProperty({
    description: 'ID único da carteira',
    example: '789e1234-e56b-78c9-d012-345678901234',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Saldo atual da carteira em reais',
    example: 1250.75,
    type: 'number',
    format: 'decimal',
    minimum: 0,
  })
  balance: number;

  @ApiProperty({
    description: 'ID do usuário proprietário da carteira',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  userId: string;

  @ApiProperty({
    description: 'Dados do usuário proprietário da carteira',
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID do usuário',
        example: '123e4567-e89b-12d3-a456-426614174000',
      },
      name: {
        type: 'string',
        description: 'Nome do usuário',
        example: 'João Silva Santos',
      },
      email: {
        type: 'string',
        description: 'Email do usuário',
        example: 'joao.silva@email.com',
      },
    },
  })
  user: {
    id: string;
    name: string;
    email: string;
  };

  @ApiProperty({
    description: 'Data de criação da carteira',
    example: '2025-06-04T10:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização da carteira',
    example: '2025-06-04T15:45:30.000Z',
    type: 'string',
    format: 'date-time',
  })
  updatedAt: Date;
}

export class BalanceResponseDto {
  @ApiProperty({
    description: 'Saldo atual em formato numérico',
    example: 1250.75,
    type: 'number',
    format: 'decimal',
    minimum: 0,
  })
  balance: number;

  @ApiProperty({
    description: 'Saldo formatado em moeda brasileira',
    example: 'R$ 1.250,75',
    type: 'string',
  })
  formatted: string;
}

export class WalletStatsDto {
  @ApiProperty({
    description: 'Saldo atual',
    example: 1250.75,
    type: 'number',
  })
  currentBalance: number;

  @ApiProperty({
    description: 'Total recebido em transferências',
    example: 2500.0,
    type: 'number',
  })
  totalReceived: number;

  @ApiProperty({
    description: 'Total enviado em transferências',
    example: 1749.25,
    type: 'number',
  })
  totalSent: number;

  @ApiProperty({
    description: 'Número total de transações',
    example: 15,
    type: 'integer',
  })
  totalTransactions: number;

  @ApiProperty({
    description: 'Data da última transação',
    example: '2025-06-04T14:30:00.000Z',
    type: 'string',
    format: 'date-time',
    nullable: true,
  })
  lastTransactionDate: Date | null;
}

export class WalletHistoryDto {
  @ApiProperty({
    description: 'Data da consulta',
    example: '2025-06-04',
    type: 'string',
    format: 'date',
  })
  date: string;

  @ApiProperty({
    description: 'Saldo no final do dia',
    example: 1250.75,
    type: 'number',
  })
  balance: number;

  @ApiProperty({
    description: 'Variação do saldo no dia',
    example: 150.5,
    type: 'number',
  })
  variation: number;

  @ApiProperty({
    description: 'Número de transações no dia',
    example: 3,
    type: 'integer',
  })
  transactionCount: number;
}
