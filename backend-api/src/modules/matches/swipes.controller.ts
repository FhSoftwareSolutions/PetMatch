import { Body, Controller, Post } from '@nestjs/common';
import { Types } from 'mongoose';

import { OwnerId } from '../../common/owner-id.decorator';
import { CreateSwipeDto } from './dto/create-swipe.dto';
import { SwipesService } from './swipes.service';

/** Endpoints de swipes (curtir/passar) consumidos pelos frontends. */
@Controller('swipes')
export class SwipesController {
  constructor(private readonly swipesService: SwipesService) {}

  /** POST /swipes — registra um like/dislike do meu pet (origem) sobre outro. */
  @Post()
  record(@Body() dto: CreateSwipeDto, @OwnerId() ownerId: Types.ObjectId) {
    return this.swipesService.record(dto, ownerId);
  }
}
