import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Types } from 'mongoose';

import { DEMO_OWNER_ID } from '../modules/pets/pets.constants';

/** Aceita exatamente um ObjectId de 24 caracteres hexadecimais. */
const isObjectIdHex = (value: string): boolean => /^[a-f0-9]{24}$/i.test(value);

/**
 * Resolve o dono da requisição a partir do header `X-Owner-Id`.
 *
 * Sem autenticação ainda, cada navegador gera e envia um ownerId estável
 * (ObjectId de 24 hex). Ausente ou inválido, cai para o DEMO_OWNER_ID — assim
 * chamadas sem identidade (testes, curl) continuam funcionando. Quando o login
 * real entrar, troca-se este resolvedor pelo usuário autenticado do JWT.
 */
export const OwnerId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Types.ObjectId => {
    const header = ctx.switchToHttp().getRequest().headers['x-owner-id'];
    const raw = Array.isArray(header) ? header[0] : header;
    return typeof raw === 'string' && isObjectIdHex(raw)
      ? new Types.ObjectId(raw)
      : DEMO_OWNER_ID;
  },
);
