import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AppModule } from './app.module';
import { Pet } from './modules/pets/schemas/pet.schema';
import { SEED_PETS } from './seed-data';

/**
 * Popula a coleção `pets` do MongoDB com dados de exemplo.
 *
 * Uso: `npm run seed` (precisa do MongoDB no ar — ex.: `docker compose up -d`).
 *
 * Reexecutar é seguro: removemos apenas os pets marcados com `metadata.seed`,
 * preservando os cadastrados pelo formulário.
 */
async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const petModel = app.get<Model<Pet>>(getModelToken(Pet.name));

    const removed = await petModel.deleteMany({ 'metadata.seed': true });
    const inserted = await petModel.insertMany(SEED_PETS);

    console.log(`🌱 Seed concluído: ${removed.deletedCount} removidos, ${inserted.length} inseridos.`);
  } finally {
    await app.close();
  }
}

run().catch((err) => {
   
  console.error('Falha no seed:', err);
  process.exit(1);
});
