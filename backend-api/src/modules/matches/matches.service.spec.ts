import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import mongoose from 'mongoose';

import { MatchesService } from './matches.service';
import { Match } from './schemas/match.schema';
import { Message } from './schemas/message.schema';
import { Pet } from '../pets/schemas/pet.schema';

describe('MatchesService', () => {
  let service: MatchesService;
  let matchModelMock: any;
  let messageModelMock: any;
  let petModelMock: any;

  const petA = {
    _id: new mongoose.Types.ObjectId('000000000000000000000001'),
    ownerId: new mongoose.Types.ObjectId('0000000000000000000000a1'),
    name: 'Thor',
    species: 'Cão',
    mainPhotoUrl: 'http://img/thor.jpg',
  };
  const petB = {
    _id: new mongoose.Types.ObjectId('000000000000000000000002'),
    ownerId: new mongoose.Types.ObjectId('0000000000000000000000b2'),
    name: 'Mel',
    species: 'Gato',
    mainPhotoUrl: 'http://img/mel.jpg',
  };

  beforeEach(async () => {
    matchModelMock = {
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ id: 'match-1', pairKey: 'x' }),
      }),
      findById: jest.fn(),
      find: jest.fn(),
    };
    petModelMock = {
      find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([petA, petB]) }),
    };
    messageModelMock = {
      aggregate: jest.fn().mockResolvedValue([]),
      countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        { provide: getModelToken(Match.name), useValue: matchModelMock },
        { provide: getModelToken(Message.name), useValue: messageModelMock },
        { provide: getModelToken(Pet.name), useValue: petModelMock },
      ],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
  });

  describe('ensureFromReciprocalLike', () => {
    it('faz upsert idempotente com pairKey canônica (ids ordenados)', async () => {
      // Passa na ordem inversa para garantir que a pairKey é ordenada.
      const result: any = await service.ensureFromReciprocalLike(
        petB._id as any,
        petA._id as any,
      );

      expect(result).toEqual({ id: 'match-1', pairKey: 'x' });
      const [filter, update, options] = matchModelMock.updateOne.mock.calls[0];
      expect(filter.pairKey).toBe(`${petA._id}_${petB._id}`); // ordenado
      expect(options).toEqual({ upsert: true });
      expect(update.$setOnInsert.petIds).toHaveLength(2);
      expect(update.$setOnInsert.summary.petA.name).toBe('Thor');
    });

    it('retorna null quando algum pet não existe', async () => {
      petModelMock.find.mockReturnValue({ exec: jest.fn().mockResolvedValue([petA]) });
      const result = await service.ensureFromReciprocalLike(petA._id as any, petB._id as any);
      expect(result).toBeNull();
      expect(matchModelMock.updateOne).not.toHaveBeenCalled();
    });
  });

  describe('listForOwner', () => {
    it('lista por ownerId ordenando por última mensagem, anexando unreadCount', async () => {
      const mid = new mongoose.Types.ObjectId();
      const m1 = { _id: mid, toJSON: () => ({ id: 'm1' }) };
      matchModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([m1]) }),
      });
      messageModelMock.aggregate.mockResolvedValue([{ _id: mid, count: 2 }]);

      const result = await service.listForOwner(petA.ownerId as any);
      expect(result).toEqual([{ id: 'm1', unreadCount: 2 }]);
      expect(matchModelMock.find).toHaveBeenCalledWith({ ownerIds: petA.ownerId });
    });

    it('devolve lista vazia sem consultar mensagens quando não há matches', async () => {
      matchModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
      });
      const result = await service.listForOwner(petA.ownerId as any);
      expect(result).toEqual([]);
      expect(messageModelMock.aggregate).not.toHaveBeenCalled();
    });
  });

  describe('unreadCountForOwner', () => {
    it('conta as mensagens não lidas destinadas ao dono', async () => {
      messageModelMock.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(5),
      });
      const result = await service.unreadCountForOwner(petA.ownerId as any);
      expect(result).toBe(5);
      expect(messageModelMock.countDocuments).toHaveBeenCalledWith({
        recipientId: petA.ownerId,
        read: false,
      });
    });
  });

  describe('getForOwner', () => {
    it('lança BadRequest com id inválido', async () => {
      await expect(service.getForOwner('nope', petA.ownerId as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('lança NotFound quando o dono não participa do match', async () => {
      matchModelMock.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ownerIds: [petB.ownerId] }),
      });
      await expect(
        service.getForOwner(new mongoose.Types.ObjectId().toString(), petA.ownerId as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('retorna o match quando o dono participa', async () => {
      const match = { _id: new mongoose.Types.ObjectId(), ownerIds: [petA.ownerId, petB.ownerId] };
      matchModelMock.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(match) });
      const result = await service.getForOwner(
        new mongoose.Types.ObjectId().toString(),
        petA.ownerId as any,
      );
      expect(result).toBe(match);
    });
  });
});
