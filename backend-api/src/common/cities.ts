/**
 * Cidades pré-definidas com suas coordenadas GeoJSON [longitude, latitude].
 *
 * Como ainda não há geolocalização do dispositivo, o cadastro escolhe uma
 * cidade desta lista e gravamos o ponto correspondente em `location` — campo
 * exigido pelo schema Pet e usado pelo recommendation-engine.
 */
export const CITIES: Record<string, [number, number]> = {
  'São Paulo': [-46.6333, -23.5505],
  'Rio de Janeiro': [-43.1729, -22.9068],
  'Belo Horizonte': [-43.9378, -19.9208],
  'Curitiba': [-49.2733, -25.4284],
  'Porto Alegre': [-51.23, -30.0346],
  'Salvador': [-38.5014, -12.9777],
  'Recife': [-34.877, -8.0476],
  'Brasília': [-47.8825, -15.7942],
  'Fortaleza': [-38.5267, -3.7319],
  'Florianópolis': [-48.548, -27.5969],
};

/** Cidade usada quando o cadastro não informa uma. */
export const DEFAULT_CITY = 'São Paulo';

/** Coordenadas [lng, lat] da cidade informada (ou da cidade padrão). */
export function coordsForCity(city?: string): [number, number] {
  return CITIES[city ?? DEFAULT_CITY] ?? CITIES[DEFAULT_CITY];
}
