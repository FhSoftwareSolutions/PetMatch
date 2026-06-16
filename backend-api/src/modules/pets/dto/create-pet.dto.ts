import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsArray, IsBoolean, IsObject, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class PetLocationDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['Point'])
  type!: string;

  @IsArray()
  @ArrayMinSize(2)
  coordinates!: number[];
}

export class CreatePetDto {
  @IsString()
  @IsNotEmpty()
  ownerId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  species!: string;

  @IsString()
  @IsOptional()
  breed?: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(['Macho', 'Fêmea'])
  gender!: string;

  @IsDateString()
  @IsNotEmpty()
  birthDate!: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(['Pequeno', 'Médio', 'Grande'])
  size!: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(['Socialização', 'Cruzamento'])
  purpose!: string;

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
  @IsNotEmpty()
  @IsEnum(['Baixa', 'Média', 'Alta'])
  energyLevel!: string;

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
  @IsNotEmpty()
  location!: PetLocationDto;
}
