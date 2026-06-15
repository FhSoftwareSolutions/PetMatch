import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { UsersModule } from './modules/users/users.module';
import { PetsModule } from './modules/pets/pets.module';
import { MatchesModule } from './modules/matches/matches.module';

@Module({
  imports: [
    // Conexão com o MongoDB (sobe via docker-compose na raiz).
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27017/petmatch',
    ),
    UsersModule,
    PetsModule,
    MatchesModule,
  ],
})
export class AppModule {}
