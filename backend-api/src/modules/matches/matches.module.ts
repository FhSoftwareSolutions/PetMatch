import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Swipe, SwipeSchema } from './schemas/swipe.schema';
import { Match, MatchSchema } from './schemas/match.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { Pet, PetSchema } from '../pets/schemas/pet.schema';
import { SwipesController } from './swipes.controller';
import { SwipesService } from './swipes.service';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

/**
 * Gerencia curtidas (swipes), matches recíprocos e o chat entre os donos.
 * Registra também o schema Pet (necessário para montar o resumo do match).
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Swipe.name, schema: SwipeSchema },
      { name: Match.name, schema: MatchSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Pet.name, schema: PetSchema },
    ]),
  ],
  controllers: [SwipesController, MatchesController, MessagesController],
  providers: [SwipesService, MatchesService, MessagesService],
  exports: [MongooseModule, MatchesService],
})
export class MatchesModule {}
