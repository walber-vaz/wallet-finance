import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Código de status HTTP',
    example: HttpStatus.BAD_REQUEST,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro ou array de mensagens',
    oneOf: [
      { type: 'string', example: 'Erro específico' },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['Erro 1', 'Erro 2'],
      },
    ],
  })
  message: string | string[];

  @ApiProperty({
    description: 'Tipo do erro',
    example: 'Bad Request',
  })
  error: string;

  @ApiProperty({
    description: 'Timestamp do erro',
    example: '2025-06-04T10:30:00.000Z',
    required: false,
  })
  timestamp?: string;

  @ApiProperty({
    description: 'Caminho da requisição',
    example: '/auth/login',
    required: false,
  })
  path?: string;
}

export class UnauthorizedResponseDto {
  @ApiProperty({
    description: 'Código de status HTTP',
    example: HttpStatus.UNAUTHORIZED,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Credenciais inválidas',
  })
  message: string;

  @ApiProperty({
    description: 'Tipo do erro',
    example: 'Unauthorized',
  })
  error: string;
}

export class ConflictResponseDto {
  @ApiProperty({
    description: 'Código de status HTTP',
    example: HttpStatus.CONFLICT,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Recurso já existe',
  })
  message: string;

  @ApiProperty({
    description: 'Tipo do erro',
    example: 'Conflict',
  })
  error: string;
}

export class NotFoundResponseDto {
  @ApiProperty({
    description: 'Código de status HTTP',
    example: HttpStatus.NOT_FOUND,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Mensagem de erro',
    example: 'Recurso não encontrado',
  })
  message: string;

  @ApiProperty({
    description: 'Tipo do erro',
    example: 'Not Found',
  })
  error: string;
}

export class ValidationErrorResponseDto {
  @ApiProperty({
    description: 'Código de status HTTP',
    example: HttpStatus.BAD_REQUEST,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Array de mensagens de validação',
    type: [String],
    example: [
      'Email deve ser um email válido',
      'Senha deve ter pelo menos 8 caracteres',
    ],
  })
  message: string[];

  @ApiProperty({
    description: 'Tipo do erro',
    example: 'Bad Request',
  })
  error: string;
}
