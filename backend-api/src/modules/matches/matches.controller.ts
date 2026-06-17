import { Controller, Get } from '@nestjs/common';
import { Types } from 'mongoose';

import { MatchesService } from './matches.service';
import { OwnerId } from '../../common/owner-id.decorator';

/** Endpoints de matches do dono autenticado (hoje via header X-Owner-Id). */
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  /** GET /matches — lista os matches do dono. */
  @Get()
  list(@OwnerId() ownerId: Types.ObjectId) {
    return this.matchesService.listForOwner(ownerId);
  }
}
