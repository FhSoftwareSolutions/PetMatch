import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Types } from 'mongoose';

import { DEMO_OWNER_ID } from '../modules/pets/pets.constants';

/** Aceita exatamente um ObjectId de 24 caracteres hexadecimais. */
const isObjectIdHex = (value: string): boolean => /^[a-f0-9]{24}$/i.test(value);

/**
 * Resolve o dono da requisição. Precedência:
 *   1. usuário autenticado por JWT (`req.user.userId`, populado pelo guard global);
 *   2. header `X-Owner-Id` (identidade anônima por navegador);
 *   3. `DEMO_OWNER_ID` (fallback para testes/curl sem identidade).
 */
export const OwnerId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Types.ObjectId => {
    const req = ctx.switchToHttp().getRequest();

    const userId = req.user?.userId;
    if (typeof userId === 'string' && isObjectIdHex(userId)) {
      return new Types.ObjectId(userId);
    }

    const header = req.headers['x-owner-id'];
    const raw = Array.isArray(header) ? header[0] : header;
    return typeof raw === 'string' && isObjectIdHex(raw)
      ? new Types.ObjectId(raw)
      : DEMO_OWNER_ID;
  },
);
