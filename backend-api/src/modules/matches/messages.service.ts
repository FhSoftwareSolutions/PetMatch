import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Message, MessageDocument } from './schemas/message.schema';
import { Match, MatchDocument } from './schemas/match.schema';
import { MatchesService } from './matches.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Match.name) private readonly matchModel: Model<MatchDocument>,
    private readonly matchesService: MatchesService,
  ) {}

  /**
   * Mensagens de um match, em ordem cronológica (autorizado ao dono).
   * Abrir a conversa marca como lidas as mensagens recebidas pelo dono — é o que
   * zera o badge de notificações daquele match (e o total na navegação).
   */
  async list(matchId: string, ownerId: Types.ObjectId): Promise<MessageDocument[]> {
    const match = await this.matchesService.getForOwner(matchId, ownerId);
    await this.messageModel.updateMany(
      { matchId: match._id, recipientId: ownerId, read: false },
      { $set: { read: true } },
    );
    return this.messageModel.find({ matchId: match._id }).sort({ createdAt: 1 }).exec();
  }

  /** Envia uma mensagem do dono para o outro participante do match. */
  async send(matchId: string, ownerId: Types.ObjectId, text: string): Promise<MessageDocument> {
    const match = await this.matchesService.getForOwner(matchId, ownerId);
    const recipientId = match.ownerIds.find((id) => !id.equals(ownerId)) ?? ownerId;

    const message = await this.messageModel.create({
      matchId: match._id,
      senderId: ownerId,
      recipientId,
      text,
    });

    // Atualiza a "última mensagem" para ordenar a lista de conversas.
    await this.matchModel.updateOne({ _id: match._id }, { $set: { lastMessageAt: new Date() } });

    return message;
  }
}
