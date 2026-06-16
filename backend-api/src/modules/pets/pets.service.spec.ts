import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PetsService } from './pets.service';
import { Pet } from './schemas/pet.schema';
import { Swipe } from '../matches/schemas/swipe.schema';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import mongoose from 'mongoose';

describe('PetsService', () => {
  let service: PetsService;
  let petModelMock: any;
  let swipeModelMock: any;

  const mockPetId = new mongoose.Types.ObjectId().toString();
  const mockOwnerId = new mongoose.Types.ObjectId().toString();
  const mockTargetPetId = new mongoose.Types.ObjectId().toString();

  const mockPetData = {
    _id: new mongoose.Types.ObjectId(mockPetId),
    ownerId: new mongoose.Types.ObjectId(mockOwnerId),
    name: 'Rex',
    species: 'Cachorro',
    breed: 'Labrador',
    gender: 'Macho',
    birthDate: new Date('2022-01-01'),
    size: 'Grande',
    purpose: 'Cruzamento',
    photos: [],
    energyLevel: 'Alta',
    sociableWithOtherPets: true,
    castrated: false,
    vaccinesUpToDate: true,
    location: {
      type: 'Point',
      coordinates: [-46.6333, -23.5505],
    },
    isActive: true,
    status: 'available',
  };

  beforeEach(async () => {
    // Instanciador do Mongoose para o teste
    petModelMock = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({
        ...dto,
        _id: new mongoose.Types.ObjectId(mockPetId),
      }),
    }));

    // Métodos estáticos do Mongoose anexados ao mock
    petModelMock.find = jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      }),
    });
    petModelMock.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPetData),
    });
    petModelMock.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPetData),
    });
    petModelMock.findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPetData),
    });

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
        {
          provide: getModelToken(Pet.name),
          useValue: petModelMock,
        },
        {
          provide: getModelToken(Swipe.name),
          useValue: swipeModelMock,
        },
      ],
    }).compile();

    service = module.get<PetsService>(PetsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a pet', async () => {
      const createDto = {
        ownerId: mockOwnerId,
        name: 'Rex',
        species: 'Cachorro',
        breed: 'Labrador',
        gender: 'Macho',
        birthDate: '2022-01-01',
        size: 'Grande',
        purpose: 'Cruzamento',
        energyLevel: 'Alta',
        location: {
          type: 'Point',
          coordinates: [-46.6333, -23.5505],
        },
      };

      const result = await service.create(createDto as any);
      expect(result).toBeDefined();
      expect(result.name).toBe('Rex');
      expect(result.ownerId).toBeInstanceOf(mongoose.Types.ObjectId);
    });
  });

  describe('findOne', () => {
    it('should return a pet if found', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockPetData),
      };
      petModelMock.findById.mockReturnValue(mockQuery);

      const result = await service.findOne(mockPetId);
      expect(result).toBeDefined();
      expect(result.name).toBe('Rex');
      expect(petModelMock.findById).toHaveBeenCalledWith(mockPetId);
    });

    it('should throw NotFoundException if pet not found', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };
      petModelMock.findById.mockReturnValue(mockQuery);

      await expect(service.findOne(mockPetId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if ID is invalid', async () => {
      await expect(service.findOne('invalid-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('should successfully update a pet', async () => {
      const updateDto = { name: 'Rex Updated' };
      const mockQuery = {
        exec: jest.fn().mockResolvedValue({ ...mockPetData, name: 'Rex Updated' }),
      };
      petModelMock.findByIdAndUpdate.mockReturnValue(mockQuery);

      const result = await service.update(mockPetId, updateDto);
      expect(result.name).toBe('Rex Updated');
      expect(petModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        mockPetId,
        expect.objectContaining({ name: 'Rex Updated' }),
        { new: true },
      );
    });
  });

  describe('getDiscoveryFeed', () => {
    it('should return compatible pets for discovery feed', async () => {
      // Pet atual
      const mockFindByIdQuery = {
        exec: jest.fn().mockResolvedValue(mockPetData),
      };
      petModelMock.findById.mockReturnValue(mockFindByIdQuery);

      // Swipes (pets que devem ser excluídos)
      const mockSwipeSelectQuery = {
        exec: jest.fn().mockResolvedValue([{ targetPetId: mockTargetPetId }]),
      };
      const mockSwipeFindQuery = {
        select: jest.fn().mockReturnValue(mockSwipeSelectQuery),
      };
      swipeModelMock.find.mockReturnValue(mockSwipeFindQuery);

      // Resultados do feed
      const mockFeedResults = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Luna',
          purpose: 'Cruzamento',
          species: 'Cachorro',
        },
      ];
      const mockPetFindLimitQuery = {
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockFeedResults),
      };
      const mockPetFindQuery = {
        limit: jest.fn().mockReturnValue(mockPetFindLimitQuery),
      };
      petModelMock.find.mockReturnValue(mockPetFindQuery);

      const result = await service.getDiscoveryFeed(mockPetId, { species: 'Cachorro' });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Luna');

      // Verifica se os filtros corretos foram repassados para a query
      expect(petModelMock.find).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
          status: 'available',
          purpose: 'Cruzamento', // Filtro excludente de cruzamento
          species: expect.any(Object),
          _id: expect.objectContaining({
            $ne: expect.any(Object),
            $nin: expect.arrayContaining([mockTargetPetId]),
          }),
        }),
      );
    });
  });
});
