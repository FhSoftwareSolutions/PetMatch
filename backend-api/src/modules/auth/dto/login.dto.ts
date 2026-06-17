import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

/** Corpo de `POST /auth/login`. */
export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
