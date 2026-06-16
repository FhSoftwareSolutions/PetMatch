import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Pet, PetSchema } from './schemas/pet.schema';
import { PetsService } from './pets.service';
import { PetsController } from './pets.controller';
import { MatchesModule } from '../matches/matches.module';

/**
 * Gerencia os perfis dos pets (espécie, raça, fotos, geolocalização).
 * Aqui ficarão os Geospatial Indexes para busca por proximidade.
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
