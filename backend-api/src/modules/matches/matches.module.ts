import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Swipe, SwipeSchema } from './schemas/swipe.schema';
import { Match, MatchSchema } from './schemas/match.schema';
import { Message, MessageSchema } from './schemas/message.schema';

/**
 * Gerencia curtidas, "matches" e a integração com o motor de
 * recomendação (recommendation-engine).
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Swipe.name, schema: SwipeSchema },
      { name: Match.name, schema: MatchSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
  ],
  controllers: [],
  providers: [],
  exports: [MongooseModule],
})
export class MatchesModule {}
