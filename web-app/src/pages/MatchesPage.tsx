import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMatches, type Match, type MatchPet } from '../services/api';
import { currentOwnerId } from '../lib/session';
import { emojiFor } from '../lib/display';
import TopBar from '../components/TopBar';
import { PawPrint, MessageCircle } from 'lucide-react';

/** Pet do OUTRO dono no match (o que interessa exibir na lista). */
function otherPet(match: Match, me: string): MatchPet {
  return match.summary.ownerA.ownerId === me ? match.summary.petB : match.summary.petA;
}

/** Lista de matches do usuário. */
export default function MatchesPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const me = currentOwnerId();

  useEffect(() => {
    (async () => {
      try {
        setMatches(await fetchMatches());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar matches.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="app">
      <TopBar />

      <div className="list-body">
        {loading && <p className="list-hint">Carregando…</p>}
        {!loading && error && <div className="form-error">{error}</div>}

        {!loading && !error && matches.length === 0 && (
          <div className="empty-inline">
            <div className="big"><PawPrint aria-hidden /></div>
            <h3>Sem matches ainda</h3>
            <p>Curta pets no feed — quando o interesse for mútuo, eles aparecem aqui.</p>
          </div>
        )}

        {!loading &&
          !error &&
          matches.map((m) => {
            const pet = otherPet(m, me);
            const unread = m.unreadCount ?? 0;
            return (
              <button
                key={m.id}
                className={`match-row${unread > 0 ? ' unread' : ''}`}
                onClick={() => navigate(`/matches/${m.id}`)}
              >
                <div className="match-avatar">
                  {pet.mainPhotoUrl ? (
                    <img src={pet.mainPhotoUrl} alt={pet.name ?? 'pet'} />
                  ) : (
                    <span>{emojiFor(pet.species ?? '')}</span>
                  )}
                </div>
                <div className="match-meta">
                  <strong>{pet.name ?? 'Pet'}</strong>
                  <span>
                    {unread > 0
                      ? `${unread} ${unread > 1 ? 'novas mensagens' : 'nova mensagem'}`
                      : pet.species}
                  </span>
                </div>
                {unread > 0 && (
                  <span className="match-badge" aria-hidden>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
                <span className="match-go" aria-label="Conversar">
                  <MessageCircle className="ic-inline" aria-hidden />
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
