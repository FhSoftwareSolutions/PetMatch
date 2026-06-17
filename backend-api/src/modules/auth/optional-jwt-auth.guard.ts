import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Autenticação opcional: popula `req.user` quando há um JWT válido, mas NUNCA
 * rejeita. Usado globalmente para permitir o fluxo anônimo (X-Owner-Id) conviver
 * com usuários autenticados — o decorator @OwnerId prefere `req.user`.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      /* token ausente/ inválido: segue como anônimo */
    }
    return true;
  }

  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return user || (undefined as TUser);
  }
}
