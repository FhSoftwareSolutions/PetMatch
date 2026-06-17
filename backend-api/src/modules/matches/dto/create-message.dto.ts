import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

/** Corpo de `POST /matches/:matchId/messages`. O remetente vem do header. */
export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text!: string;
}
