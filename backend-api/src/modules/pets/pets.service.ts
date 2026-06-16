import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Pet, PetDocument } from './schemas/pet.schema';
import { Swipe } from '../matches/schemas/swipe.schema';
import { CreatePetDto } from './dto/create-pet.dto';
import { UpdatePetDto } from './dto/update-pet.dto';

@Injectable()
export class PetsService {
  constructor(
    @InjectModel(Pet.name) private readonly petModel: Model<PetDocument>,
    @InjectModel(Swipe.name) private readonly swipeModel: Model<Swipe>,
  ) {}

  async create(createPetDto: CreatePetDto): Promise<PetDocument> {
    try {
      const createdPet = new this.petModel({
        ...createPetDto,
        ownerId: new mongoose.Types.ObjectId(createPetDto.ownerId),
      });
      return await createdPet.save();
    } catch (error: any) {
      throw new BadRequestException(`Erro ao criar pet: ${error.message}`);
    }
  }

  async update(id: string, updatePetDto: UpdatePetDto): Promise<PetDocument> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID do pet inválido');
    }

    const updateData: any = { ...updatePetDto };
    if (updatePetDto.location) {
      updateData.location = updatePetDto.location;
    }

    const updatedPet = await this.petModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedPet) {
      throw new NotFoundException(`Pet com ID ${id} não encontrado`);
    }

    return updatedPet;
  }

  async findOne(id: string): Promise<PetDocument> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID do pet inválido');
    }

    const pet = await this.petModel.findById(id).exec();
    if (!pet) {
      throw new NotFoundException(`Pet com ID ${id} não encontrado`);
    }

    return pet;
  }

  async remove(id: string): Promise<PetDocument> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID do pet inválido');
    }

    const deletedPet = await this.petModel.findByIdAndDelete(id).exec();
    if (!deletedPet) {
      throw new NotFoundException(`Pet com ID ${id} não encontrado`);
    }

    return deletedPet;
  }

  async getDiscoveryFeed(
    petId: string,
    filters: {
      species?: string;
      maxDistanceKm?: number;
      limit?: number;
      page?: number;
    } = {},
  ): Promise<PetDocument[]> {
    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw new BadRequestException('ID do pet inválido');
    }

    // 1. Buscar o pet atual para obter suas configurações de busca
    const currentPet = await this.petModel.findById(petId).exec();
    if (!currentPet) {
      throw new NotFoundException(`Pet com ID ${petId} não encontrado`);
    }

    const limit = filters.limit ?? 20;
    const page = filters.page ?? 1;
    const skip = (page - 1) * limit;

    // 2. Buscar IDs dos pets que o pet atual já deu swipe (curtiu ou descurtiu)
    const swipes = await this.swipeModel
      .find({ petId: new mongoose.Types.ObjectId(petId) })
      .select('targetPetId')
      .exec();

    const swipedPetIds = swipes.map((s) => s.targetPetId);

    // 3. Montar filtros da busca do Feed
    const query: any = {
      isActive: true,
      status: 'available',
      _id: { 
        $ne: currentPet._id,
        $nin: swipedPetIds 
      },
      ownerId: { $ne: currentPet.ownerId }, // Não mostrar pets do mesmo dono
      purpose: currentPet.purpose, // Filtro obrigatório e excludente (Socialização vs Cruzamento)
    };

    // Filtro opcional por espécie
    if (filters.species) {
      query.species = { $regex: new RegExp(`^${filters.species}$`, 'i') };
    }

    // Filtro por distância (usando as coordenadas do pet atual como origem)
    if (currentPet.location?.coordinates) {
      const maxDistanceMeters = (filters.maxDistanceKm ?? 50) * 1000; // Padrão: 50km
      query.location = {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: currentPet.location.coordinates,
          },
          $maxDistance: maxDistanceMeters,
        },
      };
    }

    return await this.petModel
      .find(query)
      .limit(limit)
      .skip(skip)
      .exec();
  }
}
