import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

/**
 * Ponto de entrada da API NestJS.
 *
 * Habilita CORS (para os frontends web/mobile), um ValidationPipe global que
 * valida os DTOs e descarta campos extras, e a documentação Swagger em `/docs`.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Libera o acesso dos frontends (web em :5173, app Expo, etc.).
  app.enableCors();

  // Valida os DTOs com class-validator: whitelist remove campos não declarados,
  // forbidNonWhitelisted rejeita (400) quem envia campos desconhecidos/com typo,
  // e transform converte os tipos vindos do JSON automaticamente.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // Documentação interativa da API em http://localhost:3000/docs.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('PetMatch API')
    .setDescription('API principal do PetMatch (pets, feed, swipes, matches, chat e auth).')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  // Porta configurável por ambiente; cai para 3000 no desenvolvimento local.
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🐾 PetMatch API rodando em http://localhost:${port}`);
}

bootstrap();
