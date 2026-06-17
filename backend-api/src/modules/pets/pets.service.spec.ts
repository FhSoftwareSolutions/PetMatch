import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import mongoose from 'mongoose';

import { PetsService } from './pets.service';
import { Pet } from './schemas/pet.schema';
import { Swipe } from '../matches/schemas/swipe.schema';

describe('PetsService', () => {
  let service: PetsService;
  let petModelMock: any;
  let swipeModelMock: any;

  const mockPetId = new mongoose.Types.ObjectId();
  const mockOwnerId = new mongoose.Types.ObjectId();

  const mockOrigin = {
    _id: mockPetId,
    ownerId: mockOwnerId,
    name: 'Rex',
    species: 'Cão',
    breed: 'Labrador',
    gender: 'macho',
    ageMonths: 24,
    size: 'grande',
    seeking: 'cruzamento',
    location: { type: 'Point', coordinates: [-46.6333, -23.5505] },
    active: true,
    status: 'available',
  };

  beforeEach(async () => {
    // Construtor do modelo (new this.petModel(doc)) + métodos estáticos.
    petModelMock = jest.fn().mockImplementation((doc) => ({
      ...doc,
      save: jest.fn().mockResolvedValue({ ...doc, _id: mockPetId }),
    }));
    petModelMock.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockOrigin),
    });
    petModelMock.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockOrigin),
    });
    petModelMock.findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockOrigin),
    });
    petModelMock.find = jest.fn();

    swipeModelMock = {
      find: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PetsService,
        { provide: getModelToken(Pet.name), useValue: petModelMock },
        { provide: getModelToken(Swipe.name), useValue: swipeModelMock },
      ],
    }).compile();

    service = module.get<PetsService>(PetsService);
  });

  afterEach(() => jest.restoreAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('cria o pet com o ownerId do header e deriva a location da cidade', async () => {
      const dto = {
        name: 'Thor',
        species: 'Cão',
        gender: 'macho',
        ageMonths: 12,
        size: 'grande',
        seeking: 'socializacao',
        city: 'São Paulo',
      } as any;

      const result: any = await service.create(dto, mockOwnerId);

      expect(result.name).toBe('Thor');
      expect(result.ownerId).toBe(mockOwnerId);
      // location derivada de "São Paulo".
      expect(result.location).toEqual({ type: 'Point', coordinates: [-46.6333, -23.5505] });
    });
  });

  describe('findAllAvailable', () => {
    it('lista pets disponíveis', async () => {
      petModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([mockOrigin]),
          }),
        }),
      });

      const result = await service.findAllAvailable();
      expect(result).toHaveLength(1);
      expect(petModelMock.find).toHaveBeenCalledWith({ active: true, status: 'available' });
    });
  });

  describe('findOne', () => {
    it('retorna o pet quando encontrado', async () => {
      const result: any = await service.findOne(mockPetId.toString());
      expect(result.name).toBe('Rex');
    });

    it('lança NotFound quando não encontra', async () => {
      petModelMock.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findOne(mockPetId.toString())).rejects.toThrow(NotFoundException);
    });

    it('lança BadRequest com id inválido', async () => {
      await expect(service.findOne('invalido')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getFeed', () => {
    it('lança BadRequest com id inválido', async () => {
      await expect(service.getFeed('invalido')).rejects.toThrow(BadRequestException);
    });

    it('lança NotFound quando o pet de origem não existe', async () => {
      petModelMock.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.getFeed(mockPetId.toString())).rejects.toThrow(NotFoundException);
    });

    it('mapeia os candidatos retornados pelo recommendation-engine', async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              petId: 'cand-1',
              name: 'Luna',
              species: 'Cão',
              gender: 'femea',
              ageMonths: 20,
              size: 'grande',
              seeking: 'cruzamento',
              score: 0.91,
              distanceKm: 3.2,
              reasons: ['Mesma espécie (Cão)'],
              temperament: ['dócil'],
            },
          ],
        }),
      });

      const result = await service.getFeed(mockPetId.toString());

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: 'cand-1', name: 'Luna', score: 0.91 });
      expect(result[0].temperament).toEqual(['dócil']);
    });

    it('cai no modo degradado (Mongo) quando o motor está fora do ar', async () => {
      (global as any).fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      petModelMock.find.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          exec: jest
            .fn()
            .mockResolvedValue([{ toJSON: () => ({ id: 'fallback-1', name: 'Plano B' }) }]),
        }),
      });

      const result = await service.getFeed(mockPetId.toString());

      expect(result).toEqual([{ id: 'fallback-1', name: 'Plano B' }]);
      // O recall degradado exclui o próprio pet e filtra por disponibilidade.
      const query = petModelMock.find.mock.calls[0][0];
      expect(query).toMatchObject({ active: true, status: 'available' });
    });
  });

  describe('update', () => {
    it('atualiza e retorna o pet', async () => {
      petModelMock.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockOrigin, name: 'Rex II' }),
      });
      const result: any = await service.update(mockPetId.toString(), { name: 'Rex II' });
      expect(result.name).toBe('Rex II');
    });
  });

  describe('remove', () => {
    it('remove e retorna o pet', async () => {
      const result: any = await service.remove(mockPetId.toString());
      expect(result.name).toBe('Rex');
    });
  });
});
