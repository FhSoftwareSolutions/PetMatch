import type { Pet } from '../services/api';
import { emojiFor } from '../lib/display';

interface MatchModalProps {
  /** Pet com quem houve match; `null` mantém o modal escondido. */
  pet: Pet | null;
  /** Fecha o modal e continua no deck. */
  onKeep: () => void;
  /** Ação de "falar com o tutor" (placeholder até existir o chat). */
  onMessage: () => void;
}

/** Tela de "É um Match!" exibida quando um like vira match. */
export default function MatchModal({ pet, onKeep, onMessage }: MatchModalProps) {
  // Sem pet não há match a mostrar.
  if (!pet) return null;

  return (
    <div className="overlay">
      {pet.mainPhotoUrl ? (
        <img className="matchface-img" src={pet.mainPhotoUrl} alt={pet.name} />
      ) : (
        <div className="matchface">{emojiFor(pet.species)}</div>
      )}
      <div className="title">É um Match!</div>
      <div className="sub">Você e {pet.name} se curtiram. Que tal dar um lar pra ele?</div>
      <div className="row">
        <button className="primary" onClick={onMessage}>
          Falar com o tutor
        </button>
        <button className="ghost" onClick={onKeep}>
          Continuar buscando
        </button>
      </div>
    </div>
  );
}
