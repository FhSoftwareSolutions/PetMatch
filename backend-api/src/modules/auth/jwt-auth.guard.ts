import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Exige um JWT válido (401 caso ausente/ inválido). Usado em rotas protegidas. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
