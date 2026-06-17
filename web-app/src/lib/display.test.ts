import { describe, it, expect } from 'vitest';
import { formatAge, scorePercent, emojiFor, visibleReasons, speciesLine } from './display';
import type { Pet } from '../services/api';

describe('display helpers', () => {
  it('formata idade em meses/anos', () => {
    expect(formatAge(1)).toBe('1 mês');
    expect(formatAge(6)).toBe('6 meses');
    expect(formatAge(12)).toBe('1 ano');
    expect(formatAge(28)).toBe('2 anos');
  });

  it('converte score em porcentagem', () => {
    expect(scorePercent(0.91)).toBe(91);
    expect(scorePercent(0)).toBe(0);
  });

  it('escolhe o emoji por espécie', () => {
    expect(emojiFor('Gato')).toBe('🐱');
    expect(emojiFor('Cão')).toBe('🐶');
    expect(emojiFor('Coelho')).toBe('🐰');
    expect(emojiFor('Tartaruga')).toBe('🐾');
  });

  it('remove o motivo de distância e limita a quantidade', () => {
    expect(
      visibleReasons(['Mesma espécie (Cão)', 'A 3 km de distância', 'Mesmo porte'], 2),
    ).toEqual(['Mesma espécie (Cão)', 'Mesmo porte']);
    expect(visibleReasons(undefined)).toEqual([]);
  });

  it('monta a linha de espécie + raça', () => {
    expect(speciesLine({ species: 'Cão', breed: 'Labrador' } as Pet)).toBe('Cão • Labrador');
    expect(speciesLine({ species: 'Gato' } as Pet)).toBe('Gato');
  });
});
