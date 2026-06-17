import { Test, TestingModule } from '@nestjs/testing';
import { PetsController } from './pets.controller';
import { PetsService } from './pets.service';

describe('PetsController', () => {
  let controller: PetsController;
  let service: PetsService;

  const mockPetResult = {
    id: 'mock-pet-id',
    name: 'Rex',
    species: 'Cachorro',
  };

  const mockPetsService = {
    create: jest.fn().mockResolvedValue(mockPetResult),
    findOne: jest.fn().mockResolvedValue(mockPetResult),
    update: jest.fn().mockResolvedValue(mockPetResult),
    remove: jest.fn().mockResolvedValue(mockPetResult),
    getDiscoveryFeed: jest.fn().mockResolvedValue([mockPetResult]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PetsController],
      providers: [
        {
          provide: PetsService,
          useValue: mockPetsService,
        },
      ],
    }).compile();

    controller = module.get<PetsController>(PetsController);
    service = module.get<PetsService>(PetsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with DTO', async () => {
      const dto = { name: 'Rex' } as any;
      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockPetResult);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id', async () => {
      const result = await controller.findOne('id');
      expect(service.findOne).toHaveBeenCalledWith('id');
      expect(result).toEqual(mockPetResult);
    });
  });

  describe('update', () => {
    it('should call service.update with id and DTO', async () => {
      const dto = { name: 'Rex' } as any;
      const result = await controller.update('id', dto);
      expect(service.update).toHaveBeenCalledWith('id', dto);
      expect(result).toEqual(mockPetResult);
    });
  });

  describe('remove', () => {
    it('should call service.remove with id', async () => {
      const result = await controller.remove('id');
      expect(service.remove).toHaveBeenCalledWith('id');
      expect(result).toEqual(mockPetResult);
    });
  });

  describe('getDiscoveryFeed', () => {
    it('should call service.getDiscoveryFeed with parsed parameters', async () => {
      const result = await controller.getDiscoveryFeed(
        'id',
        'Cachorro',
        '25',
        '10',
        '2',
      );
      expect(service.getDiscoveryFeed).toHaveBeenCalledWith('id', {
        species: 'Cachorro',
        maxDistanceKm: 25,
        limit: 10,
        page: 2,
      });
      expect(result).toEqual([mockPetResult]);
    });
  });
});
