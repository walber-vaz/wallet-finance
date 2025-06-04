import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import {
  CreateUserDto,
  LoginUserDto,
  UserResponseDto,
  LoginResponseDto,
  UserProfileDto,
} from '../users/dto/user.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Cadastrar novo usuário',
    description:
      'Cria uma nova conta de usuário com carteira automaticamente criada',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'Dados para criação do usuário',
    examples: {
      exemplo1: {
        summary: 'Usuário exemplo',
        description: 'Exemplo de dados para cadastro',
        value: {
          name: 'João Silva Santos',
          email: 'joao.silva@email.com',
          password: 'MinhaSenh@123',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Usuário criado com sucesso',
    type: UserResponseDto,
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'João Silva Santos',
      email: 'joao.silva@email.com',
      createdAt: '2025-06-04T10:30:00.000Z',
    },
  })
  @ApiBadRequestResponse({
    description: 'Dados inválidos fornecidos',
    example: {
      statusCode: HttpStatus.BAD_REQUEST,
      message: [
        'Email inválido',
        'Senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos',
      ],
      error: 'Bad Request',
    },
  })
  @ApiConflictResponse({
    description: 'Email já está em uso',
    example: {
      statusCode: HttpStatus.CONFLICT,
      message: 'Email já está em uso',
      error: 'Conflict',
    },
  })
  async register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fazer login',
    description: 'Autentica o usuário e retorna um token JWT válido por 7 dias',
  })
  @ApiBody({
    type: LoginUserDto,
    description: 'Credenciais de login',
    examples: {
      exemplo1: {
        summary: 'Login exemplo',
        description: 'Exemplo de login com credenciais válidas',
        value: {
          email: 'joao.silva@email.com',
          password: 'MinhaSenh@123',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login realizado com sucesso',
    type: LoginResponseDto,
    example: {
      access_token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6ImpvYW8uc2lsdmFAZW1haWwuY29tIiwiaWF0IjoxNjI0NTQ3MjAwLCJleHAiOjE2MjUxNTIwMDB9...',
      user: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'João Silva Santos',
        email: 'joao.silva@email.com',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Dados de login inválidos',
    example: {
      statusCode: HttpStatus.BAD_REQUEST,
      message: ['Email inválido', 'Senha deve ter pelo menos 8 caracteres'],
      error: 'Bad Request',
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciais inválidas',
    example: {
      statusCode: HttpStatus.UNAUTHORIZED,
      message: 'Credenciais inválidas',
      error: 'Unauthorized',
    },
  })
  async login(@Body() loginDto: LoginUserDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obter perfil do usuário',
    description:
      'Retorna os dados do usuário logado incluindo saldo da carteira',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dados do perfil do usuário',
    type: UserProfileDto,
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'João Silva Santos',
      email: 'joao.silva@email.com',
      wallet: {
        balance: 1000.0,
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
  getProfile(@CurrentUser() user: User): UserProfileDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      wallet: {
        balance: Number(user.wallet.balance),
      },
    };
  }
}
