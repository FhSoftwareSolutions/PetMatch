import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import mongoose from 'mongoose';

import { SwipesService } from './swipes.service';
import { Swipe } from './schemas/swipe.schema';
import { MatchesService } from './matches.service';

describe('SwipesService', () => {
  let service: SwipesService;
  let swipeModelMock: any;
  let matchesServiceMock: any;

  const ownerId = new mongoose.Types.ObjectId();
  const petId = new mongoose.Types.ObjectId().toString();
  const targetPetId = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    swipeModelMock = {
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
      exists: jest.fn().mockResolvedValue(null),
    };
    matchesServiceMock = {
      ensureFromReciprocalLike: jest.fn().mockResolvedValue({ id: 'match-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwipesService,
        { provide: getModelToken(Swipe.name), useValue: swipeModelMock },
        { provide: MatchesService, useValue: matchesServiceMock },
      ],
    }).compile();

    service = module.get<SwipesService>(SwipesService);
  });

  it('persiste o swipe (upsert idempotente)', async () => {
    await service.record({ petId, targetPetId, type: 'like' }, ownerId);
    expect(swipeModelMock.updateOne).toHaveBeenCalledTimes(1);
    const [filter, , options] = swipeModelMock.updateOne.mock.calls[0];
    expect(filter.petId.toString()).toBe(petId);
    expect(filter.targetPetId.toString()).toBe(targetPetId);
    expect(options).toEqual({ upsert: true });
  });

  it('dislike nunca dá match e não checa reciprocidade', async () => {
    const result = await service.record({ petId, targetPetId, type: 'dislike' }, ownerId);
    expect(result).toEqual({ matched: false });
    expect(swipeModelMock.exists).not.toHaveBeenCalled();
  });

  it('like sem reciprocidade retorna matched:false', async () => {
    swipeModelMock.exists.mockResolvedValue(null);
    const result = await service.record({ petId, targetPetId, type: 'like' }, ownerId);
    expect(result).toEqual({ matched: false });
  });

  it('like com reciprocidade (o alvo já curtiu) cria o match e retorna matched:true', async () => {
    swipeModelMock.exists.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });
    const result = await service.record({ petId, targetPetId, type: 'like' }, ownerId);
    expect(result).toEqual({ matched: true, matchId: 'match-1' });
    expect(matchesServiceMock.ensureFromReciprocalLike).toHaveBeenCalledTimes(1);
    // Procura o swipe inverso (alvo -> origem) do tipo like.
    expect(swipeModelMock.exists).toHaveBeenCalledWith({
      petId: expect.anything(),
      targetPetId: expect.anything(),
      type: 'like',
    });
  });

  it('like sem reciprocidade não cria match', async () => {
    swipeModelMock.exists.mockResolvedValue(null);
    await service.record({ petId, targetPetId, type: 'like' }, ownerId);
    expect(matchesServiceMock.ensureFromReciprocalLike).not.toHaveBeenCalled();
  });
});
