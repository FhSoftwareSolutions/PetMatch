import { IsString, IsNotEmpty, IsEmail, MinLength, IsOptional } from 'class-validator';

/** Corpo de `POST /auth/register`. */
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  city?: string;
}
