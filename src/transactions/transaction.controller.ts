import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { TransactionsService } from './transaction.service';
import {
  CreateTransferDto,
  TransactionResponseDto,
  TransactionHistoryDto,
} from './dto/transaction.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post('transfer')
  @ApiOperation({
    summary: 'Realizar transferência entre usuários',
    description:
      'Executa uma transferência de dinheiro do usuário logado para outro usuário. A operação é realizada dentro de uma transação ACID com validação de saldo e rollback automático em caso de erro.',
  })
  @ApiBody({
    type: CreateTransferDto,
    description: 'Dados da transferência',
    examples: {
      exemplo1: {
        summary: 'Transferência simples',
        description: 'Exemplo de transferência básica com descrição',
        value: {
          toUserId: '456e7890-e12b-34c5-d678-901234567890',
          amount: 150.5,
          description: 'Pagamento do almoço',
        },
      },
      exemplo2: {
        summary: 'Transferência sem descrição',
        description: 'Transferência sem descrição personalizada',
        value: {
          toUserId: '456e7890-e12b-34c5-d678-901234567890',
          amount: 1000.0,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Transferência realizada com sucesso',
    type: TransactionResponseDto,
    example: {
      id: 'abc12345-f678-90gh-ij12-345678901234',
      amount: 150.5,
      type: 'transfer',
      status: 'completed',
      description: 'Pagamento do almoço',
      fromUserId: '123e4567-e89b-12d3-a456-426614174000',
      toUserId: '456e7890-e12b-34c5-d678-901234567890',
      fromUser: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'João Silva Santos',
        email: 'joao.silva@email.com',
      },
      toUser: {
        id: '456e7890-e12b-34c5-d678-901234567890',
        name: 'Maria Santos Silva',
        email: 'maria.santos@email.com',
      },
      createdAt: '2025-06-04T14:30:00.000Z',
    },
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos ou saldo insuficiente',
    examples: {
      saldoInsuficiente: {
        summary: 'Saldo insuficiente',
        value: {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Saldo insuficiente. Saldo atual: R$ 50.25',
          error: 'Bad Request',
        },
      },
      transferenciaPropria: {
        summary: 'Transferência para si mesmo',
        value: {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Não é possível transferir para si mesmo',
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
  @ApiNotFoundResponse({
    description: 'Usuário destinatário não encontrado',
    example: {
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Usuário destinatário não encontrado',
      error: 'Not Found',
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
  async transfer(
    @CurrentUser() user: User,
    @Body() transferDto: CreateTransferDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.transfer(user.id, transferDto);
  }

  @Post(':id/reverse')
  @ApiOperation({
    summary: 'Reverter uma transação',
    description:
      'Reverte uma transação completada, criando uma transação compensatória. Apenas o remetente ou destinatário da transação original pode solicitar a reversão. Verifica se há saldo suficiente antes de executar.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da transação a ser revertida',
    example: 'abc12345-f678-90gh-ij12-345678901234',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Transação revertida com sucesso',
    type: TransactionResponseDto,
    example: {
      id: 'def67890-g123-45hi-jk67-890123456789',
      amount: 150.5,
      type: 'reversal',
      status: 'completed',
      description: 'Reversão da transação abc12345-f678-90gh-ij12-345678901234',
      fromUserId: '456e7890-e12b-34c5-d678-901234567890',
      toUserId: '123e4567-e89b-12d3-a456-426614174000',
      fromUser: {
        id: '456e7890-e12b-34c5-d678-901234567890',
        name: 'Maria Santos Silva',
        email: 'maria.santos@email.com',
      },
      toUser: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'João Silva Santos',
        email: 'joao.silva@email.com',
      },
      createdAt: '2025-06-04T15:45:00.000Z',
    },
  })
  @ApiBadRequestResponse({
    description: 'Transação não pode ser revertida',
    examples: {
      jaRevertida: {
        summary: 'Transação já revertida',
        value: {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Esta transação já foi revertida',
          error: 'Bad Request',
        },
      },
      naoCompletada: {
        summary: 'Transação não completada',
        value: {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Apenas transações completadas podem ser revertidas',
          error: 'Bad Request',
        },
      },
      saldoInsuficiente: {
        summary: 'Saldo insuficiente para reversão',
        value: {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Destinatário não possui saldo suficiente para reversão',
          error: 'Bad Request',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Transação não encontrada',
    example: {
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Transação não encontrada',
      error: 'Not Found',
    },
  })
  @ApiForbiddenResponse({
    description: 'Sem permissão para reverter esta transação',
    example: {
      statusCode: HttpStatus.FORBIDDEN,
      message: 'Você não tem permissão para reverter esta transação',
      error: 'Forbidden',
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
  async reverseTransaction(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) transactionId: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.reverseTransaction(transactionId, user.id);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Obter histórico de transações',
    description:
      'Retorna o histórico completo de transações do usuário logado, incluindo transferências enviadas, recebidas e reversões. Os dados são ordenados pela data mais recente.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Histórico de transações do usuário',
    type: [TransactionHistoryDto],
    example: [
      {
        id: 'abc12345-f678-90gh-ij12-345678901234',
        amount: 150.5,
        type: 'transfer',
        status: 'completed',
        description: 'Pagamento do almoço',
        isIncoming: false,
        otherUser: {
          id: '456e7890-e12b-34c5-d678-901234567890',
          name: 'Maria Santos Silva',
          email: 'maria.santos@email.com',
        },
        createdAt: '2025-06-04T14:30:00.000Z',
      },
      {
        id: 'def67890-g123-45hi-jk67-890123456789',
        amount: 75.25,
        type: 'transfer',
        status: 'completed',
        description: 'Recebimento via PIX',
        isIncoming: true,
        otherUser: {
          id: '789f0123-h456-78ij-kl90-123456789012',
          name: 'Pedro Costa Lima',
          email: 'pedro.costa@email.com',
        },
        createdAt: '2025-06-04T10:15:00.000Z',
      },
    ],
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido ou expirado',
    example: {
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  async getHistory(
    @CurrentUser() user: User,
  ): Promise<TransactionHistoryDto[]> {
    return this.transactionsService.getTransactionHistory(user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obter detalhes de uma transação específica',
    description:
      'Retorna os detalhes completos de uma transação específica. O usuário só pode visualizar transações em que ele é remetente ou destinatário.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da transação a ser consultada',
    example: 'abc12345-f678-90gh-ij12-345678901234',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detalhes da transação',
    type: TransactionResponseDto,
    example: {
      id: 'abc12345-f678-90gh-ij12-345678901234',
      amount: 150.5,
      type: 'transfer',
      status: 'completed',
      description: 'Pagamento do almoço',
      fromUserId: '123e4567-e89b-12d3-a456-426614174000',
      toUserId: '456e7890-e12b-34c5-d678-901234567890',
      fromUser: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'João Silva Santos',
        email: 'joao.silva@email.com',
      },
      toUser: {
        id: '456e7890-e12b-34c5-d678-901234567890',
        name: 'Maria Santos Silva',
        email: 'maria.santos@email.com',
      },
      createdAt: '2025-06-04T14:30:00.000Z',
    },
  })
  @ApiNotFoundResponse({
    description: 'Transação não encontrada',
    example: {
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Transação não encontrada',
      error: 'Not Found',
    },
  })
  @ApiForbiddenResponse({
    description: 'Sem permissão para visualizar esta transação',
    example: {
      statusCode: HttpStatus.FORBIDDEN,
      message: 'Você não tem permissão para ver esta transação',
      error: 'Forbidden',
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
  async getTransaction(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) transactionId: string,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.getTransactionById(transactionId, user.id);
  }
}
