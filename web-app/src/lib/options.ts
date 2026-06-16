/**
 * Opções dos campos do formulário de cadastro.
 *
 * As cidades espelham o mapa do backend (`common/cities.ts`); os demais valores
 * batem com os enums do schema Pet (gender/size/seeking).
 */

export const CITIES = [
  'São Paulo',
  'Rio de Janeiro',
  'Belo Horizonte',
  'Curitiba',
  'Porto Alegre',
  'Salvador',
  'Recife',
  'Brasília',
  'Fortaleza',
  'Florianópolis',
];

export const SPECIES = ['Cão', 'Gato', 'Coelho', 'Papagaio', 'Outro'];

export const GENDERS = [
  { value: 'macho', label: 'Macho' },
  { value: 'femea', label: 'Fêmea' },
];

export const SIZES = [
  { value: 'pequeno', label: 'Pequeno' },
  { value: 'medio', label: 'Médio' },
  { value: 'grande', label: 'Grande' },
];

export const SEEKINGS = [
  { value: 'socializacao', label: 'Socialização (brincar)' },
  { value: 'cruzamento', label: 'Cruzamento' },
  { value: 'ambos', label: 'Ambos' },
];
