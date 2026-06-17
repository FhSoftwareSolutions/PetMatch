import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { Types } from 'mongoose';

import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { OwnerId } from '../../common/owner-id.decorator';

/** Chat dentro de um match: lista e envia mensagens. */
@Controller('matches/:matchId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /** GET /matches/:matchId/messages — conversa em ordem cronológica. */
  @Get()
  list(@Param('matchId') matchId: string, @OwnerId() ownerId: Types.ObjectId) {
    return this.messagesService.list(matchId, ownerId);
  }

  /** POST /matches/:matchId/messages — envia uma mensagem. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  send(
    @Param('matchId') matchId: string,
    @Body() dto: CreateMessageDto,
    @OwnerId() ownerId: Types.ObjectId,
  ) {
    return this.messagesService.send(matchId, ownerId, dto.text);
  }
}
