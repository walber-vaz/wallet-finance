import {
  Controller,
  Get,
  Post,
  Body,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import {
  WalletResponseDto,
  BalanceResponseDto,
  WalletStatsDto,
} from './dto/wallet.dto';
import {
  AddBalanceDto,
  WithdrawBalanceDto,
  BalanceOperationResponseDto,
} from './dto/wallet-operation.dto';

@ApiTags('wallet')
@Controller('wallet')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({
    summary: 'Obter informações completas da carteira',
    description:
      'Retorna todos os dados da carteira do usuário logado, incluindo saldo, informações do usuário e histórico de criação/atualização',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dados completos da carteira',
    type: WalletResponseDto,
    example: {
      id: '789e1234-e56b-78c9-d012-345678901234',
      balance: 1250.75,
      userId: '123e4567-e89b-12d3-a456-426614174000',
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'João Silva Santos',
        email: 'joao.silva@email.com',
      },
      createdAt: '2025-06-04T10:30:00.000Z',
      updatedAt: '2025-06-04T15:45:30.000Z',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido ou expirado',
    example: {
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiNotFoundResponse({
    description: 'Carteira não encontrada',
    example: {
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Carteira não encontrada',
      error: 'Not Found',
    },
  })
  async getMyWallet(@CurrentUser() user: User): Promise<WalletResponseDto> {
    return this.walletService.getWalletByUserId(user.id);
  }

  @Get('balance')
  @ApiOperation({
    summary: 'Obter saldo atual da carteira',
    description:
      'Retorna apenas o saldo atual da carteira em formato numérico e formatado para moeda brasileira',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Saldo atual da carteira',
    type: BalanceResponseDto,
    example: {
      balance: 1250.75,
      formatted: 'R$ 1.250,75',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido ou expirado',
    example: {
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiNotFoundResponse({
    description: 'Carteira não encontrada',
    example: {
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Carteira não encontrada',
      error: 'Not Found',
    },
  })
  async getMyBalance(@CurrentUser() user: User): Promise<BalanceResponseDto> {
    const balance = await this.walletService.getBalance(user.id);
    return {
      balance,
      formatted: `${Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(balance)}`,
    };
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Obter estatísticas da carteira',
    description:
      'Retorna estatísticas detalhadas da carteira incluindo saldo atual, total recebido, total enviado, número de transações e data da última transação',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estatísticas completas da carteira',
    type: WalletStatsDto,
    example: {
      currentBalance: 1250.75,
      totalReceived: 2500.0,
      totalSent: 1749.25,
      totalTransactions: 15,
      lastTransactionDate: '2025-06-04T14:30:00.000Z',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido ou expirado',
    example: {
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiNotFoundResponse({
    description: 'Carteira não encontrada',
    example: {
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Carteira não encontrada',
      error: 'Not Found',
    },
  })
  async getMyWalletStats(@CurrentUser() user: User): Promise<WalletStatsDto> {
    return this.walletService.getWalletStats(user.id);
  }

  @Post('deposit')
  @ApiOperation({
    summary: 'Adicionar saldo à carteira',
    description:
      'Adiciona um valor ao saldo da carteira do usuário logado. Cria uma transação de depósito e atualiza o saldo de forma atômica.',
  })
  @ApiBody({
    type: AddBalanceDto,
    description: 'Dados do depósito',
    examples: {
      exemplo1: {
        summary: 'Depósito simples',
        description: 'Depósito com descrição personalizada',
        value: {
          amount: 500.0,
          description: 'Depósito via PIX',
        },
      },
      exemplo2: {
        summary: 'Depósito sem descrição',
        description: 'Depósito sem descrição personalizada',
        value: {
          amount: 1000.0,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Depósito realizado com sucesso',
    type: BalanceOperationResponseDto,
    example: {
      transactionId: 'xyz98765-a123-45bc-de67-890123456789',
      operation: 'deposit',
      amount: 500.0,
      previousBalance: 1250.75,
      newBalance: 1750.75,
      description: 'Depósito via PIX',
      createdAt: '2025-06-04T16:30:00.000Z',
    },
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos',
    example: {
      statusCode: HttpStatus.BAD_REQUEST,
      message: ['O valor deve ser maior que zero'],
      error: 'Bad Request',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido ou expirado',
    example: {
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiNotFoundResponse({
    description: 'Carteira não encontrada',
    example: {
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Carteira não encontrada',
      error: 'Not Found',
    },
  })
  async addBalance(
    @CurrentUser() user: User,
    @Body() addBalanceDto: AddBalanceDto,
  ): Promise<BalanceOperationResponseDto> {
    return this.walletService.addBalance(user.id, addBalanceDto);
  }

  @Post('withdraw')
  @ApiOperation({
    summary: 'Retirar saldo da carteira',
    description:
      'Retira um valor do saldo da carteira do usuário logado. Valida se há saldo suficiente e cria uma transação de saque.',
  })
  @ApiBody({
    type: WithdrawBalanceDto,
    description: 'Dados do saque',
    examples: {
      exemplo1: {
        summary: 'Saque simples',
        description: 'Saque com descrição personalizada',
        value: {
          amount: 200.5,
          description: 'Saque no caixa eletrônico',
        },
      },
      exemplo2: {
        summary: 'Saque sem descrição',
        description: 'Saque sem descrição personalizada',
        value: {
          amount: 100.0,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Saque realizado com sucesso',
    type: BalanceOperationResponseDto,
    example: {
      transactionId: 'abc12345-b456-78cd-ef90-123456789012',
      operation: 'withdrawal',
      amount: 200.5,
      previousBalance: 1750.75,
      newBalance: 1550.25,
      description: 'Saque no caixa eletrônico',
      createdAt: '2025-06-04T17:15:00.000Z',
    },
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou saldo insuficiente',
    examples: {
      saldoInsuficiente: {
        summary: 'Saldo insuficiente',
        value: {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Saldo insuficiente para saque. Saldo atual: R$ 50.25',
          error: 'Bad Request',
        },
      },
      valorInvalido: {
        summary: 'Valor inválido',
        value: {
          statusCode: HttpStatus.BAD_REQUEST,
          message: ['O valor deve ser maior que zero'],
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido ou expirado',
    example: {
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiNotFoundResponse({
    description: 'Carteira não encontrada',
    example: {
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Carteira não encontrada',
      error: 'Not Found',
    },
  })
  async withdrawBalance(
    @CurrentUser() user: User,
    @Body() withdrawBalanceDto: WithdrawBalanceDto,
  ): Promise<BalanceOperationResponseDto> {
    return this.walletService.withdrawBalance(user.id, withdrawBalanceDto);
  }
}
