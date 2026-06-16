import { IsString, IsOptional, IsEnum, IsDateString, IsArray, IsBoolean, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PetLocationDto } from './create-pet.dto';

export class UpdatePetDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  species?: string;

  @IsString()
  @IsOptional()
  breed?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['Macho', 'Fêmea'])
  gender?: string;

  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['Pequeno', 'Médio', 'Grande'])
  size?: string;

  @IsString()
  @IsOptional()
  @IsEnum(['Socialização', 'Cruzamento'])
  purpose?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];

  @IsString()
  @IsOptional()
  mainPhotoUrl?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsObject()
  @IsOptional()
  characteristics?: Record<string, any>;

  @IsString()
  @IsOptional()
  @IsEnum(['Baixa', 'Média', 'Alta'])
  energyLevel?: string;

  @IsBoolean()
  @IsOptional()
  sociableWithOtherPets?: boolean;

  @IsBoolean()
  @IsOptional()
  castrated?: boolean;

  @IsBoolean()
  @IsOptional()
  vaccinesUpToDate?: boolean;

  @ValidateNested()
  @Type(() => PetLocationDto)
  @IsOptional()
  location?: PetLocationDto;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
