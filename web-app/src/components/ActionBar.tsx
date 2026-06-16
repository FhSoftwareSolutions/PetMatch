interface ActionBarProps {
  /** Passa (descarta) o card do topo. */
  onNope: () => void;
  /** Curte o card do topo. */
  onLike: () => void;
  /** Desfaz o último swipe. */
  onRewind: () => void;
  /** Habilita o botão "voltar" só quando há histórico. */
  canRewind: boolean;
  /** Habilita curtir/passar só quando há um card no topo. */
  canSwipe: boolean;
}

/**
 * Barra de ações fixa no rodapé: voltar, passar, detalhes e curtir.
 * Os botões grandes (passar/curtir) espelham o gesto de arrastar o card.
 */
export default function ActionBar({ onNope, onLike, onRewind, canRewind, canSwipe }: ActionBarProps) {
  return (
    <div className="actions">
      <button
        className="fab sm rewind"
        onClick={onRewind}
        disabled={!canRewind}
        title="Voltar"
        aria-label="Voltar"
      >
        ↩
      </button>
      <button
        className="fab lg nope"
        onClick={onNope}
        disabled={!canSwipe}
        title="Passar"
        aria-label="Passar"
      >
        ✕
      </button>
      {/* Detalhes do pet ainda não implementado — desabilitado por enquanto. */}
      <button className="fab sm info" disabled title="Detalhes (em breve)" aria-label="Detalhes (em breve)">
        ℹ
      </button>
      <button
        className="fab lg like"
        onClick={onLike}
        disabled={!canSwipe}
        title="Curtir"
        aria-label="Curtir"
      >
        ♥
      </button>
    </div>
  );
}
