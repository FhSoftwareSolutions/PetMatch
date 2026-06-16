import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { CreatePetDto } from './dto/create-pet.dto';
import { PetsService } from './pets.service';

/** Endpoints REST de pets consumidos pelos frontends (web/mobile). */
@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  /** GET /pets — lista simples dos pets disponíveis. */
  @Get()
  findAll() {
    return this.petsService.findFeed();
  }

  /**
   * GET /pets/feed?petId=... — feed ORDENADO pelo recommendation-engine para o
   * pet de origem informado. Sem `petId`, devolve a lista simples.
   */
  @Get('feed')
  feed(@Query('petId') petId?: string) {
    return petId ? this.petsService.findRecommendedFeed(petId) : this.petsService.findFeed();
  }

  /** POST /pets — cadastra um novo pet. */
  @Post()
  create(@Body() dto: CreatePetDto) {
    return this.petsService.create(dto);
  }
}
