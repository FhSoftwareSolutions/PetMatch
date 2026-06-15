import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Pet, PetSchema } from './schemas/pet.schema';

/**
 * Gerencia os perfis dos pets (espécie, raça, fotos, geolocalização).
 * Aqui ficarão os Geospatial Indexes para busca por proximidade.
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Pet.name, schema: PetSchema }]),
  ],
  controllers: [],
  providers: [],
  exports: [MongooseModule],
})
export class PetsModule {}
