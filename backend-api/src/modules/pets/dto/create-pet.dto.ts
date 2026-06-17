import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsArray,
  IsUrl,
  IsObject,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Localização em GeoJSON Point; opcional no cadastro (deriva da cidade). */
export class PetLocationDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['Point'])
  type!: string;

  @IsArray()
  @ArrayMinSize(2)
  coordinates!: number[];
}

/**
 * Campos aceitos em `POST /pets`. O `ownerId` NÃO vem no corpo: é resolvido do
 * header `X-Owner-Id` (decorator @OwnerId). A `location` também é opcional —
 * quando ausente, o service a deriva da `city`.
 */
export class CreatePetDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  species!: string;

  @IsString()
  @IsOptional()
  breed?: string;

  @IsEnum(['macho', 'femea'])
  gender!: string;

  // transform:true (ValidationPipe) converte "24" -> 24 vindo do JSON/query.
  @IsInt()
  @Min(0)
  @Max(600)
  ageMonths!: number;

  @IsEnum(['pequeno', 'medio', 'grande'])
  size!: string;

  @IsEnum(['socializacao', 'cruzamento', 'ambos'])
  seeking!: string;

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
}
