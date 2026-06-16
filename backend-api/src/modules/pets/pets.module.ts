import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';
import { Pet, PetSchema } from './schemas/pet.schema';

/**
 * Gerencia os perfis dos pets (cadastro, listagem para o feed, geolocalização).
 * Os índices geoespaciais (2dsphere) usados na busca por proximidade são
 * definidos no schema, em `schemas/pet.schema.ts`.
 */
@Module({
  imports: [MongooseModule.forFeature([{ name: Pet.name, schema: PetSchema }])],
  controllers: [PetsController],
  providers: [PetsService],
  exports: [MongooseModule],
})
export class PetsModule {}
