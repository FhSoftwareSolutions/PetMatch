import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchFeed, fetchPets, recordSwipe, type Pet } from '../services/api';
import { getMyPet, setMyPet, type MyPet } from '../lib/session';
import PetCard, { type PetCardHandle, type SwipeDir } from '../components/PetCard';
import ActionBar from '../components/ActionBar';
import MatchModal from '../components/MatchModal';
import RegisterPetPage from './RegisterPetPage';

// Marca, no navegador, que o usuário já passou pelo cadastro inicial.
const ONBOARDED_KEY = 'petmatch_onboarded';

/**
 * Tela principal de descoberta.
 *
 * Se há um "meu pet" (origem), busca o feed ORDENADO pelo recommendation-engine
 * (`GET /pets/feed`) com score de match; senão, cai para a lista simples. Mantém
 * histórico para "voltar", mostra a tela de match e abre o cadastro como overlay.
 */
export default function SwipePage() {
  const navigate = useNavigate();
  const [myPet, setMyPetState] = useState<MyPet | null>(() => getMyPet());
  const [deck, setDeck] = useState<Pet[]>([]);
  const [history, setHistory] = useState<Pet[]>([]);
  const [match, setMatch] = useState<{ pet: Pet; matchId?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Na 1ª visita (sem pet e sem onboarding) abre o cadastro automaticamente.
  const [showRegister, setShowRegister] = useState(
    () => !getMyPet() && !localStorage.getItem(ONBOARDED_KEY),
  );
  // Ref do card de cima, usada pelos botões da ActionBar para disparar o swipe.
  const topCardRef = useRef<PetCardHandle>(null);

  // Recarrega o feed ao montar e sempre que o pet de origem muda.
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myPet?.id]);

  /** Busca o feed (recomendado se há origem, simples caso contrário). */
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const pets = myPet ? await fetchFeed(myPet.id) : await fetchPets();
      setDeck(pets);
      setHistory([]);
      setMatch(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar os pets.');
    } finally {
      setLoading(false);
    }
  }

  /** Processa o swipe: arquiva no histórico, tira do deck e às vezes dá match. */
  function handleSwipe(dir: SwipeDir, pet: Pet) {
    setHistory((h) => [...h, pet]);
    setDeck((d) => d.slice(1));

    // Sem "meu pet" (origem) não há o que registrar/matchear.
    if (!myPet) return;

    const type = dir === 'like' ? 'like' : 'dislike';
    // Persiste o swipe; em likes, usa a reciprocidade REAL devolvida pelo backend
    // (matched + matchId) para abrir a tela de match. Best-effort: falha não trava.
    void recordSwipe(myPet.id, pet.id, type)
      .then((res) => {
        if (dir === 'like' && res.matched) setMatch({ pet, matchId: res.matchId });
      })
      .catch(() => {
        /* swipe é best-effort; uma falha de rede não interrompe a navegação */
      });
  }

  /** Desfaz o último swipe, devolvendo o pet ao topo do deck. */
  function rewind() {
    setHistory((h) => {
      if (!h.length) return h;
      const last = h[h.length - 1];
      setDeck((d) => [last, ...d]);
      return h.slice(0, -1);
    });
  }

  /** Pet recém-cadastrado vira o novo "meu pet" (origem) e recarrega o feed. */
  function handleCreated(pet: Pet) {
    setMyPet(pet);
    setMyPetState({ id: pet.id, name: pet.name });
    localStorage.setItem(ONBOARDED_KEY, '1');
    setShowRegister(false);
  }

  /** Fecha o cadastro (também conclui o onboarding). */
  function closeRegister() {
    localStorage.setItem(ONBOARDED_KEY, '1');
    setShowRegister(false);
  }

  /** Abre o chat do match (ou a lista, se por algum motivo não veio o id). */
  function goToChat() {
    const id = match?.matchId;
    setMatch(null);
    navigate(id ? `/matches/${id}` : '/matches');
  }

  // Cadastro aberto: ocupa a tela; o feed recarrega ao voltar (origem nova).
  if (showRegister) {
    return (
      <RegisterPetPage isOnboarding={!myPet} onDone={handleCreated} onCancel={closeRegister} />
    );
  }

  // Renderiza até 3 cards empilhados; o do topo é o primeiro do array.
  const visible = deck.slice(0, 3);
  const canSwipe = !loading && !error && deck.length > 0;

  return (
    <div className="app">
      <header>
        <div className="brand">
          <span className="pin">🐾</span>
          <b>Pet</b>
          <i>Match</i>
        </div>
        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={() => setShowRegister(true)}
            title="Cadastrar pet"
            aria-label="Cadastrar pet"
          >
            ➕
          </button>
          <button
            className="icon-btn"
            onClick={() => navigate('/matches')}
            title="Matches"
            aria-label="Matches"
          >
            💬
          </button>
          <button
            className="icon-btn"
            onClick={() => navigate('/perfil')}
            title="Perfil"
            aria-label="Perfil"
          >
            👤
          </button>
          <button
            className="icon-btn"
            onClick={() => void load()}
            title="Recarregar"
            aria-label="Recarregar"
          >
            ↻
          </button>
        </div>
      </header>

      {myPet && (
        <div className="feed-hint">
          Recomendados para <b>{myPet.name}</b>
        </div>
      )}

      <div className="deck-wrap">
        {loading && (
          <div className="empty">
            <div className="big spin">🐾</div>
            <p>Carregando pets…</p>
          </div>
        )}

        {!loading && error && (
          <div className="empty">
            <div className="big">😿</div>
            <h3>Ops!</h3>
            <p>{error}</p>
            <button onClick={() => void load()}>Tentar de novo</button>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="deck">
              {visible.map((pet, i) => {
                const isTop = i === 0;
                return (
                  <PetCard
                    key={pet.id}
                    ref={isTop ? topCardRef : null}
                    pet={pet}
                    isTop={isTop}
                    depth={i}
                    onSwipe={handleSwipe}
                  />
                );
              })}
            </div>

            {/* Estado vazio: acabaram os pets do deck. */}
            {deck.length === 0 && (
              <div className="empty">
                <div className="big">🦴</div>
                <h3>Por enquanto é só!</h3>
                <p>Você viu todos os pets disponíveis. Cadastre um novo ou recarregue.</p>
                <button onClick={() => setShowRegister(true)}>Cadastrar um pet</button>
              </div>
            )}
          </>
        )}
      </div>

      <ActionBar
        onNope={() => topCardRef.current?.flick('nope')}
        onLike={() => topCardRef.current?.flick('like')}
        onRewind={rewind}
        canRewind={history.length > 0}
        canSwipe={canSwipe}
      />

      <MatchModal pet={match?.pet ?? null} onKeep={() => setMatch(null)} onMessage={goToChat} />
    </div>
  );
}
