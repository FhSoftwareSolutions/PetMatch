import { Test, TestingModule } from '@nestjs/testing';
import mongoose from 'mongoose';

import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';

describe('PetsController', () => {
  let controller: PetsController;
  let service: PetsService;

  const mockPetResult = { id: 'mock-pet-id', name: 'Rex', species: 'Cão' };
  const ownerId = new mongoose.Types.ObjectId();

  const mockPetsService = {
    create: jest.fn().mockResolvedValue(mockPetResult),
    findAllAvailable: jest.fn().mockResolvedValue([mockPetResult]),
    findMine: jest.fn().mockResolvedValue([mockPetResult]),
    getFeed: jest.fn().mockResolvedValue([mockPetResult]),
    findOne: jest.fn().mockResolvedValue(mockPetResult),
    update: jest.fn().mockResolvedValue(mockPetResult),
    remove: jest.fn().mockResolvedValue(mockPetResult),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PetsController],
      providers: [{ provide: PetsService, useValue: mockPetsService }],
    }).compile();

    controller = module.get<PetsController>(PetsController);
    service = module.get<PetsService>(PetsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('lista pets disponíveis', async () => {
      const result = await controller.findAll();
      expect(service.findAllAvailable).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([mockPetResult]);
    });
  });

  describe('getFeed', () => {
    it('encaminha petId e limit (parseado) para o service', async () => {
      const result = await controller.getFeed('pet-1', '10');
      expect(service.getFeed).toHaveBeenCalledWith('pet-1', 10);
      expect(result).toEqual([mockPetResult]);
    });
  });

  describe('findMine', () => {
    it('lista os pets do dono', async () => {
      const result = await controller.findMine(ownerId);
      expect(service.findMine).toHaveBeenCalledWith(ownerId);
      expect(result).toEqual([mockPetResult]);
    });
  });

  describe('create', () => {
    it('chama service.create com o DTO e o ownerId do header', async () => {
      const dto = { name: 'Rex' } as any;
      const result = await controller.create(dto, ownerId);
      expect(service.create).toHaveBeenCalledWith(dto, ownerId);
      expect(result).toEqual(mockPetResult);
    });
  });

  describe('findOne', () => {
    it('chama service.findOne com o id', async () => {
      const result = await controller.findOne('id');
      expect(service.findOne).toHaveBeenCalledWith('id');
      expect(result).toEqual(mockPetResult);
    });
  });

  describe('update', () => {
    it('chama service.update com id, DTO e ownerId', async () => {
      const dto = { name: 'Rex' } as any;
      const result = await controller.update('id', dto, ownerId);
      expect(service.update).toHaveBeenCalledWith('id', dto, ownerId);
      expect(result).toEqual(mockPetResult);
    });
  });

  describe('remove', () => {
    it('chama service.remove com id e ownerId', async () => {
      const result = await controller.remove('id', ownerId);
      expect(service.remove).toHaveBeenCalledWith('id', ownerId);
      expect(result).toEqual(mockPetResult);
    });
  });
});
