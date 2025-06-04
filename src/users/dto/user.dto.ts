import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva Santos',
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty({
    message: 'Nome é obrigatório',
  })
  @IsString({
    message: 'Nome deve ser uma string',
  })
  @Transform(({ value }: { value: string }) => {
    const capitalizedValue = value
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return capitalizedValue;
  })
  name: string;

  @ApiProperty({
    description: 'Email válido e único do usuário',
    example: 'joao.silva@email.com',
    format: 'email',
    uniqueItems: true,
  })
  @IsEmail(
    {},
    {
      message: 'Email inválido',
    },
  )
  @IsNotEmpty({
    message: 'Email é obrigatório',
  })
  email: string;

  @ApiProperty({
    description:
      'Senha forte com pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e símbolos',
    example: 'MinhaSenh@123',
    minLength: 8,
    format: 'password',
  })
  @IsNotEmpty({
    message: 'Senha é obrigatória',
  })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos',
    },
  )
  password: string;
}

export class LoginUserDto {
  @ApiProperty({
    description: 'Email do usuário registrado',
    example: 'joao.silva@email.com',
    format: 'email',
  })
  @IsEmail(
    {},
    {
      message: 'Email inválido',
    },
  )
  @IsNotEmpty({
    message: 'Email é obrigatório',
  })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'MinhaSenh@123',
    minLength: 8,
    format: 'password',
  })
  @IsNotEmpty({
    message: 'Senha é obrigatória',
  })
  @MinLength(8, {
    message: 'Senha deve ter pelo menos 8 caracteres',
  })
  password: string;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'ID único do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva Santos',
  })
  name: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao.silva@email.com',
  })
  email: string;

  @ApiProperty({
    description: 'Data de criação do usuário',
    example: '2025-06-04T10:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  createdAt: Date;
}

export class LoginResponseDto {
  @ApiProperty({
    description: 'Token JWT para autenticação',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Dados do usuário logado',
    type: () => UserResponseDto,
  })
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export class UserProfileDto {
  @ApiProperty({
    description: 'ID único do usuário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva Santos',
  })
  name: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao.silva@email.com',
  })
  email: string;

  @ApiProperty({
    description: 'Informações da carteira do usuário',
    type: 'object',
    properties: {
      balance: {
        type: 'number',
        description: 'Saldo atual da carteira',
        example: 1000.5,
      },
    },
  })
  wallet: {
    balance: number;
  };
}
