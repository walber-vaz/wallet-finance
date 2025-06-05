import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import { ConsoleLogger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      colors: true,
      json: true,
    }),
  });

  app.enableShutdownHooks();
  app.setGlobalPrefix('api/v1');
  app.enableCors();
  app.use(helmet());
  app.use(
    compression({
      level: 6,
      threshold: 1024,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Wallet Finance API')
    .setDescription(
      'API para sistema de carteira financeira com transferências e autenticação',
    )
    .setVersion('1.0')
    .addTag('auth', 'Operações de autenticação e cadastro')
    .addTag('wallet', 'Operações da carteira financeira')
    .addTag('transactions', 'Operações de transferências e histórico')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Insira o token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Wallet Finance API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
