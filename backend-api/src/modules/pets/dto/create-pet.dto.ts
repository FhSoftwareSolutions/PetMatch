import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { CITIES } from '../../../common/cities';

/**
 * Dados enviados pelo formulário de cadastro de pet.
 *
 * Validado pelo ValidationPipe global (whitelist + transform), então campos
 * extras são descartados e os tipos são convertidos a partir do JSON.
 */
export class CreatePetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  species!: string; // ex.: "Cão", "Gato"

  @IsOptional()
  @IsString()
  @MaxLength(60)
  breed?: string;

  @IsIn(['macho', 'femea'])
  gender!: string;

  @IsInt()
  @Min(0)
  @Max(360) // até 30 anos, em meses
  ageMonths!: number;

  @IsIn(['pequeno', 'medio', 'grande'])
  size!: string;

  @IsIn(['socializacao', 'cruzamento', 'ambos'])
  seeking!: string;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  bio?: string;

  @IsOptional()
  @IsUrl()
  mainPhotoUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  temperament?: string[];

  // Restrito às cidades conhecidas: garante que `location` (derivado da cidade)
  // bata com o que é exibido, em vez de cair silenciosamente na cidade padrão.
  @IsOptional()
  @IsIn(Object.keys(CITIES))
  city?: string;
}
