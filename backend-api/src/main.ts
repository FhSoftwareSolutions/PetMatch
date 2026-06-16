import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

/**
 * Ponto de entrada da API NestJS.
 *
 * Habilita CORS (para os frontends web/mobile) e um ValidationPipe global que
 * valida os DTOs e descarta campos extras. A documentação Swagger fica como
 * próximo passo.
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

  // Porta configurável por ambiente; cai para 3000 no desenvolvimento local.
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🐾 PetMatch API rodando em http://localhost:${port}`);
}

bootstrap();
