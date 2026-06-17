import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsArray,
  IsUrl,
  IsObject,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PetLocationDto } from './create-pet.dto';

/** Campos editáveis de um pet (todos opcionais). Espelha o CreatePetDto. */
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

  @IsEnum(['macho', 'femea'])
  @IsOptional()
  gender?: string;

  @IsInt()
  @Min(0)
  @Max(600)
  @IsOptional()
  ageMonths?: number;

  @IsEnum(['pequeno', 'medio', 'grande'])
  @IsOptional()
  size?: string;

  @IsEnum(['socializacao', 'cruzamento', 'ambos'])
  @IsOptional()
  seeking?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsUrl()
  @IsOptional()
  mainPhotoUrl?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  temperament?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  recommendationTags?: string[];

  @IsObject()
  @IsOptional()
  compatibility?: Record<string, any>;

  @ValidateNested()
  @Type(() => PetLocationDto)
  @IsOptional()
  location?: PetLocationDto;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsEnum(['available', 'hidden', 'adopted'])
  @IsOptional()
  status?: string;
}
