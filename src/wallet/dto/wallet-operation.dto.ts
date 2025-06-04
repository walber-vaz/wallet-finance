import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsPositive,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class AddBalanceDto {
  @ApiProperty({
    description: 'Valor a ser adicionado ao saldo em reais',
    example: 500.0,
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
    description: 'Descrição opcional do depósito',
    example: 'Depósito via PIX',
    required: false,
    maxLength: 255,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

export class WithdrawBalanceDto {
  @ApiProperty({
    description: 'Valor a ser retirado do saldo em reais',
    example: 200.5,
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
    description: 'Descrição opcional do saque',
    example: 'Saque no caixa eletrônico',
    required: false,
    maxLength: 255,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

export class BalanceOperationResponseDto {
  @ApiProperty({
    description: 'ID da transação criada',
    example: 'xyz98765-a123-45bc-de67-890123456789',
    format: 'uuid',
  })
  transactionId: string;

  @ApiProperty({
    description: 'Tipo da operação realizada',
    example: 'deposit',
    enum: ['deposit', 'withdrawal'],
  })
  operation: string;

  @ApiProperty({
    description: 'Valor da operação',
    example: 500.0,
    type: 'number',
  })
  amount: number;

  @ApiProperty({
    description: 'Saldo anterior',
    example: 1250.75,
    type: 'number',
  })
  previousBalance: number;

  @ApiProperty({
    description: 'Novo saldo após a operação',
    example: 1750.75,
    type: 'number',
  })
  newBalance: number;

  @ApiProperty({
    description: 'Descrição da operação',
    example: 'Depósito via PIX',
  })
  description: string;

  @ApiProperty({
    description: 'Data e hora da operação',
    example: '2025-06-04T16:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;
}
