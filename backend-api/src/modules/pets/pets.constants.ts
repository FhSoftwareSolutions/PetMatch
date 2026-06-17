import { Types } from 'mongoose';

/**
 * Dono "demo" usado enquanto não há autenticação.
 *
 * O schema Pet exige `ownerId`; sem login ainda, os pets cadastrados pelo
 * formulário são atribuídos a este dono fixo. Quando a autenticação entrar, o
 * `ownerId` passa a vir do usuário logado.
 */
export const DEMO_OWNER_ID = new Types.ObjectId('000000000000000000000001');

/**
 * Donos fictícios distribuídos entre os pets do seed.
 *
 * Precisam ser DIFERENTES do DEMO_OWNER_ID: o recommendation-engine exclui do
 * feed os pets do mesmo dono que o pet de origem (que é o pet do usuário, com
 * DEMO_OWNER_ID). Se todos os pets do seed tivessem o mesmo dono do usuário,
 * o feed recomendado viria vazio.
 */
export const SEED_OWNER_IDS = [
  new Types.ObjectId('000000000000000000000011'),
  new Types.ObjectId('000000000000000000000012'),
  new Types.ObjectId('000000000000000000000013'),
  new Types.ObjectId('000000000000000000000014'),
  new Types.ObjectId('000000000000000000000015'),
  new Types.ObjectId('000000000000000000000016'),
];

/**
 * Raio (km) usado no feed recomendado.
 *
 * Os pets de exemplo estão espalhados por várias cidades do Brasil; um raio
 * grande garante um feed populado independentemente da cidade do pet de origem,
 * deixando a ordenação ser definida principalmente pela similaridade de conteúdo.
 */
export const FEED_RADIUS_KM = 10000;

/** Quantidade padrão de itens retornados pelo feed. */
export const FEED_DEFAULT_LIMIT = 20;

/**
 * Compatibilidade de objetivo: o que um pet com dado `seeking` aceita ver.
 *
 * Espelha o `SEEKING_COMPAT` do recommendation-engine e é usado apenas no modo
 * degradado do feed (quando o motor está indisponível e caímos no Mongo direto).
 */
export const SEEKING_COMPAT: Record<string, string[]> = {
  cruzamento: ['cruzamento', 'ambos'],
  socializacao: ['socializacao', 'ambos'],
  ambos: ['cruzamento', 'socializacao', 'ambos'],
};
