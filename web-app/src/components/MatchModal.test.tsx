import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MatchModal from './MatchModal';
import type { Pet } from '../services/api';

const pet: Pet = {
  id: '1',
  name: 'Mel',
  species: 'Gato',
  gender: 'femea',
  ageMonths: 12,
  size: 'pequeno',
  seeking: 'ambos',
  temperament: [],
  recommendationTags: [],
};

describe('MatchModal', () => {
  it('não renderiza nada sem pet', () => {
    const { container } = render(<MatchModal pet={null} onKeep={() => {}} onMessage={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra o título e o nome do pet quando há match', () => {
    render(<MatchModal pet={pet} onKeep={() => {}} onMessage={() => {}} />);
    expect(screen.getByText('É um Match!')).toBeInTheDocument();
    expect(screen.getByText(/Mel/)).toBeInTheDocument();
  });
});
