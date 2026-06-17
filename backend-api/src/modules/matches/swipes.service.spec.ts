import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import mongoose from 'mongoose';

import { SwipesService } from './swipes.service';
import { Swipe } from './schemas/swipe.schema';

describe('SwipesService', () => {
  let service: SwipesService;
  let swipeModelMock: any;

  const ownerId = new mongoose.Types.ObjectId();
  const petId = new mongoose.Types.ObjectId().toString();
  const targetPetId = new mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    swipeModelMock = {
      updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
      exists: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SwipesService,
        { provide: getModelToken(Swipe.name), useValue: swipeModelMock },
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

  it('like com reciprocidade (o alvo já curtiu) retorna matched:true', async () => {
    swipeModelMock.exists.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });
    const result = await service.record({ petId, targetPetId, type: 'like' }, ownerId);
    expect(result).toEqual({ matched: true });
    // Procura o swipe inverso (alvo -> origem) do tipo like.
    expect(swipeModelMock.exists).toHaveBeenCalledWith({
      petId: expect.anything(),
      targetPetId: expect.anything(),
      type: 'like',
    });
  });
});
