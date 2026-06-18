import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Types } from 'mongoose';

import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';
import { OwnerId } from '../../common/owner-id.decorator';

/**
 * CRUD de pets + feed recomendado (a entidade central do PetMatch).
 *
 * Mapeia as rotas HTTP para o PetsService:
 *   POST   /pets        cria        | GET /pets       lista disponíveis
 *   GET    /pets/:id    lê um       | PATCH /pets/:id  atualiza (dono)
 *   DELETE /pets/:id    remove (dono)| GET /pets/feed   feed recomendado
 *
 * IMPORTANTE: as rotas fixas (`feed`, `mine`) são declaradas ANTES de `:id`,
 * senão o Nest capturaria "feed"/"mine" como se fossem um id.
 */
@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  /** GET /pets — lista simples de pets disponíveis (sem ordenação por recomendação). */
  @Get()
  findAll(@Query('limit') limit?: string) {
    return this.petsService.findAllAvailable(limit ? parseInt(limit, 10) : undefined);
  }

  /**
   * GET /pets/feed?petId=... — feed ordenado pelo recommendation-engine.
   * Declarado ANTES de `:id` para que "feed" não seja capturado como um id.
   */
  @Get('feed')
  getFeed(@Query('petId') petId: string, @Query('limit') limit?: string) {
    return this.petsService.getFeed(petId, limit ? parseInt(limit, 10) : undefined);
  }

  /** GET /pets/mine — pets do dono (declarada antes de `:id`). */
  @Get('mine')
  findMine(@OwnerId() ownerId: Types.ObjectId) {
    return this.petsService.findMine(ownerId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPetDto: CreatePetDto, @OwnerId() ownerId: Types.ObjectId) {
    return this.petsService.create(createPetDto, ownerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.petsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePetDto: UpdatePetDto,
    @OwnerId() ownerId: Types.ObjectId,
  ) {
    return this.petsService.update(id, updatePetDto, ownerId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @OwnerId() ownerId: Types.ObjectId) {
    return this.petsService.remove(id, ownerId);
  }
}
