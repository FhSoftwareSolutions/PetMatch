import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersModule } from './modules/users/users.module';
import { PetsModule } from './modules/pets/pets.module';
import { MatchesModule } from './modules/matches/matches.module';

@Module({
  imports: [
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
  ],
})
export class AppModule {}
