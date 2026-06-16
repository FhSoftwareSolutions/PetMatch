import { IsIn, IsMongoId } from 'class-validator';

/**
 * Dados de um swipe enviados pelo frontend.
 *
 * Validado pelo ValidationPipe global (whitelist + forbidNonWhitelisted), então
 * só estes três campos são aceitos. O dono vem do header `X-Owner-Id`, não do corpo.
 */
export class CreateSwipeDto {
  // Pet de origem: o "meu pet" que está avaliando.
  @IsMongoId()
  petId!: string;

  // Pet avaliado (o card do topo do deck).
  @IsMongoId()
  targetPetId!: string;

  @IsIn(['like', 'dislike'])
  type!: string;
}
