import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { UsersModule } from './modules/users/users.module';
import { PetsModule } from './modules/pets/pets.module';
import { MatchesModule } from './modules/matches/matches.module';
import { AuthModule } from './modules/auth/auth.module';
import { OptionalJwtAuthGuard } from './modules/auth/optional-jwt-auth.guard';

@Module({
  imports: [
    // Carrega variáveis de .env e disponibiliza o ConfigService em todo o app.
    ConfigModule.forRoot({ isGlobal: true }),
    // Conexão com o MongoDB (sobe via docker-compose na raiz).
    // Usamos 127.0.0.1 (e não "localhost") de propósito: "localhost" pode
    // resolver para IPv6 (::1) ou IPv4, e o motor de recomendação (Python) e o
    // backend (Node) resolvem de formas diferentes — apontar para 127.0.0.1 nos
    // dois garante que leiam/escrevam no MESMO MongoDB.
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/petmatch',
    ),
    UsersModule,
    PetsModule,
    MatchesModule,
    AuthModule,
  ],
  providers: [
    // Autenticação opcional em todas as rotas: popula req.user quando há JWT
    // válido, sem bloquear o fluxo anônimo (X-Owner-Id).
    { provide: APP_GUARD, useClass: OptionalJwtAuthGuard },
  ],
})
export class AppModule {}
