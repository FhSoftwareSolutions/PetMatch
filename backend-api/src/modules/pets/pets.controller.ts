import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Controller('pets')
export class PetsController {
  constructor(private readonly petsService: PetsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPetDto: CreatePetDto) {
    return this.petsService.create(createPetDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.petsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePetDto: UpdatePetDto) {
    return this.petsService.update(id, updatePetDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.petsService.remove(id);
  }

  @Get(':id/feed')
  getDiscoveryFeed(
    @Param('id') id: string,
    @Query('species') species?: string,
    @Query('maxDistanceKm') maxDistanceKm?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.petsService.getDiscoveryFeed(id, {
      species,
      maxDistanceKm: maxDistanceKm ? parseFloat(maxDistanceKm) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
    });
  }
}
