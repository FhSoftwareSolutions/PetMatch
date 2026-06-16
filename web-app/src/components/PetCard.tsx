import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import type { Pet } from '../services/api';
import {
  emojiFor,
  formatAge,
  gradientFor,
  scorePercent,
  speciesLine,
  visibleReasons,
} from '../lib/display';

/** Direção de saída do card: curtir (direita) ou passar (esquerda). */
export type SwipeDir = 'like' | 'nope';

/** Métodos expostos pela ref do card de cima (acionados pela ActionBar). */
export interface PetCardHandle {
  /** Anima o card para fora na direção dada, como um swipe manual. */
  flick: (dir: SwipeDir) => void;
}

interface PetCardProps {
  pet: Pet;
  /** true apenas para o card do topo (o único arrastável). */
  isTop: boolean;
  /** Posição na pilha (0 = topo); controla escala/deslocamento do empilhamento. */
  depth: number;
  /** Chamado quando o card sai da tela após um swipe. */
  onSwipe: (dir: SwipeDir, pet: Pet) => void;
}

/**
 * Card individual do deck. Mostra a foto real do pet (com fallback de emoji +
 * gradiente caso não haja foto ou ela falhe ao carregar) e implementa o gesto
 * de arrastar via Pointer Events. Expõe `flick()` pela ref para a ActionBar.
 */
const PetCard = forwardRef<PetCardHandle, PetCardProps>(function PetCard(
  { pet, isTop, depth, onSwipe },
  ref,
) {
  const cardRef = useRef<HTMLDivElement>(null);
  // Estado do arraste guardado em ref: muda a cada pixel sem causar re-render.
  // `leaving` evita que o mesmo card seja descartado duas vezes (double-tap).
  const drag = useRef({ active: false, startX: 0, startY: 0, dx: 0, leaving: false });
  // Carimbo visível durante o arraste: -1 = "Passar", +1 = "Adotar", 0 = nenhum.
  const [overlay, setOverlay] = useState(0);
  // Cai para o visual de emoji se a imagem não carregar.
  const [imgError, setImgError] = useState(false);

  const [c1, c2] = gradientFor(pet.id);
  // Empilhamento: cada card abaixo do topo recua e encolhe um pouco.
  const baseTransform = `translateY(${depth * 10}px) scale(${1 - depth * 0.04})`;
  const showPhoto = Boolean(pet.mainPhotoUrl) && !imgError;
  // Score de match e motivos só existem no feed recomendado.
  const reasons = visibleReasons(pet.reasons);

  /** Anima o card para fora da tela e avisa o pai quando a animação termina. */
  function leave(dir: SwipeDir) {
    const el = cardRef.current;
    if (!el || drag.current.leaving) return; // já está saindo: ignora chamadas repetidas
    drag.current.leaving = true;
    const toX = dir === 'like' ? 600 : -600;
    el.style.transition = 'transform .4s ease';
    el.style.transform = `translate(${toX}px,-40px) rotate(${dir === 'like' ? 28 : -28}deg)`;
    // Espera a animação rodar antes de remover o card do deck.
    window.setTimeout(() => onSwipe(dir, pet), 280);
  }

  // Permite que os botões da ActionBar disparem o swipe do card de cima.
  useImperativeHandle(ref, () => ({ flick: leave }), [pet]);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (!isTop || drag.current.leaving) return; // só o card do topo, e não enquanto ele sai
    const el = cardRef.current;
    if (!el) return;
    drag.current = { ...drag.current, active: true, startX: e.clientX, startY: e.clientY, dx: 0 };
    el.style.transition = 'none';
    el.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return;
    const el = cardRef.current;
    if (!el) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    drag.current.dx = dx;
    // Acompanha o cursor e inclina o card proporcionalmente ao deslocamento.
    el.style.transform = `translate(${dx}px,${dy}px) rotate(${dx / 18}deg)`;
    setOverlay(dx > 30 ? 1 : dx < -30 ? -1 : 0);
  }

  function onPointerUp() {
    if (!drag.current.active) return;
    const el = cardRef.current;
    if (!el) return;
    drag.current.active = false;
    const { dx } = drag.current;
    // Passou do limiar -> confirma o swipe; senão, volta à posição original.
    if (Math.abs(dx) > 110) {
      leave(dx > 0 ? 'like' : 'nope');
    } else {
      el.style.transition = 'transform .25s ease';
      el.style.transform = baseTransform;
      setOverlay(0);
    }
  }

  return (
    <div
      ref={cardRef}
      className="card"
      style={{ transform: baseTransform, zIndex: 10 - depth }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="photo" style={{ background: `linear-gradient(150deg, ${c1}, ${c2})` }}>
        {showPhoto ? (
          <img
            className="photo-img"
            src={pet.mainPhotoUrl}
            alt={pet.name}
            draggable={false}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="emoji">{emojiFor(pet.species)}</div>
        )}
        <div className="scrim" />
        <div className="stamp like" style={{ opacity: overlay === 1 ? 1 : 0 }}>
          Adotar
        </div>
        <div className="stamp nope" style={{ opacity: overlay === -1 ? 1 : 0 }}>
          Passar
        </div>
        <div className="info">
          {typeof pet.score === 'number' && (
            <div className="score-pill">❤ {scorePercent(pet.score)}% de match</div>
          )}
          <h2>
            {pet.name} <span>{formatAge(pet.ageMonths)}</span>
          </h2>
          <div className="meta">
            📍 {pet.city ?? 'Brasil'} • {speciesLine(pet)}
          </div>
          {reasons.length > 0 && <div className="reasons">✨ {reasons.join(' · ')}</div>}
          {pet.bio && <div className="bio">{pet.bio}</div>}
          {pet.temperament.length > 0 && (
            <div className="tags">
              {pet.temperament.map((t) => (
                <span className="tag" key={t}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default PetCard;
