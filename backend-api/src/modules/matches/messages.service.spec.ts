import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import mongoose from 'mongoose';

import { MessagesService } from './messages.service';
import { Message } from './schemas/message.schema';
import { Match } from './schemas/match.schema';
import { MatchesService } from './matches.service';

describe('MessagesService', () => {
  let service: MessagesService;
  let messageModelMock: any;
  let matchModelMock: any;
  let matchesServiceMock: any;

  const ownerId = new mongoose.Types.ObjectId('0000000000000000000000a1');
  const otherOwnerId = new mongoose.Types.ObjectId('0000000000000000000000b2');
  const matchId = new mongoose.Types.ObjectId();
  const match = { _id: matchId, ownerIds: [ownerId, otherOwnerId] };

  beforeEach(async () => {
    messageModelMock = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([{ id: 'msg-1' }]) }),
      }),
      create: jest.fn().mockResolvedValue({ id: 'msg-new' }),
    };
    matchModelMock = { updateOne: jest.fn().mockResolvedValue({ acknowledged: true }) };
    matchesServiceMock = { getForOwner: jest.fn().mockResolvedValue(match) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: getModelToken(Message.name), useValue: messageModelMock },
        { provide: getModelToken(Match.name), useValue: matchModelMock },
        { provide: MatchesService, useValue: matchesServiceMock },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  describe('list', () => {
    it('autoriza pelo dono e devolve a conversa em ordem', async () => {
      const result = await service.list(matchId.toString(), ownerId);
      expect(matchesServiceMock.getForOwner).toHaveBeenCalledWith(matchId.toString(), ownerId);
      expect(messageModelMock.find).toHaveBeenCalledWith({ matchId });
      expect(result).toEqual([{ id: 'msg-1' }]);
    });
  });

  describe('send', () => {
    it('cria a mensagem com o outro dono como destinatário e atualiza lastMessageAt', async () => {
      const result = await service.send(matchId.toString(), ownerId, 'Oi!');

      expect(result).toEqual({ id: 'msg-new' });
      const payload = messageModelMock.create.mock.calls[0][0];
      expect(payload.senderId).toBe(ownerId);
      expect(payload.recipientId).toBe(otherOwnerId); // o outro participante
      expect(payload.text).toBe('Oi!');
      expect(matchModelMock.updateOne).toHaveBeenCalledWith(
        { _id: matchId },
        { $set: { lastMessageAt: expect.any(Date) } },
      );
    });
  });
});
