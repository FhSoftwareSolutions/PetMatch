import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Pet, PetSchema } from './schemas/pet.schema';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { MatchesModule } from '../matches/matches.module';

/**
 * Gerencia os perfis dos pets (cadastro, listagem para o feed, geolocalização).
 * Os índices geoespaciais (2dsphere) usados na busca por proximidade são
 * definidos no schema, em `schemas/pet.schema.ts`.
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Pet.name, schema: PetSchema }]),
    MatchesModule,
  ],
  controllers: [PetsController],
  providers: [PetsService],
  exports: [MongooseModule, PetsService],
})
export class PetsModule {}
