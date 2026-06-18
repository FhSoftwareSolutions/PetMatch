/**
 * Helpers de apresentação dos pets (derivam rótulos/visuais a partir dos
 * dados crus vindos da API).
 */

import type { Pet } from '../services/api';

/** Emoji usado como fallback visual quando não há foto (ou ela falha). */
export function emojiFor(species: string): string {
  const s = species.toLowerCase();
  if (s.includes('gat')) return '🐱';
  if (s.includes('cã') || s.includes('cao') || s.includes('cachorro') || s.includes('dog')) {
    return '🐶';
  }
  if (s.includes('coelho')) return '🐰';
  if (
    s.includes('papagaio') ||
    s.includes('ave') ||
    s.includes('pássaro') ||
    s.includes('passaro') ||
    s.includes('parrot') ||
    s.includes('bird')
  ) {
    return '🦜';
  }
  return '🐾';
}

// Paleta de gradientes para o fundo do card (usada no fallback sem foto).
// Realinhada ao design system "Warm Playful Refinado": apenas hues da marca
// (coral / mint / sun / info), sem roxos/azuis-claros fora da identidade.
const GRADIENTS: [string, string][] = [
  ['#E14A3C', '#FF6B5E'], // coral-strong -> coral
  ['#19B6A3', '#0E7A6E'], // mint -> mint-deep
  ['#FFC94B', '#A66B00'], // sun -> sun-deep
  ['#5567C9', '#3B4FB0'], // info -> info escuro
  ['#FF6B5E', '#C8392C'], // coral -> coral-deep
  ['#0E7A6E', '#19B6A3'], // mint-deep -> mint
];

/** Escolhe um gradiente estável a partir do id do pet. */
export function gradientFor(id: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

/** Formata a idade em meses para algo legível ("2 anos", "6 meses"). */
export function formatAge(months: number): string {
  if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? 'ano' : 'anos'}`;
}

/** Linha de espécie + raça ("Cão • Labrador"). */
export function speciesLine(pet: Pet): string {
  return pet.breed ? `${pet.species} • ${pet.breed}` : pet.species;
}

/** Score de match (0..1) em porcentagem inteira. */
export function scorePercent(score: number): number {
  return Math.round(score * 100);
}

/**
 * Motivos da recomendação relevantes para o card.
 * Remove o motivo de distância ("A X km...") — com raio grande ele fica enorme.
 */
export function visibleReasons(reasons: string[] | undefined, max = 2): string[] {
  if (!reasons) return [];
  return reasons.filter((r) => !r.startsWith('A ')).slice(0, max);
}
