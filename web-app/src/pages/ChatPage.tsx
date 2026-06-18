import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchMatches,
  fetchMessages,
  sendMessage,
  type Match,
  type MatchPet,
  type Message,
} from '../services/api';
import { currentOwnerId } from '../lib/session';
import { emojiFor } from '../lib/display';
import TopBar from '../components/TopBar';
import { ArrowLeft } from 'lucide-react';

// Intervalo de atualização do chat (recebimento "ao vivo" por polling).
const POLL_MS = 2500;
// Janela para agrupar mensagens consecutivas do mesmo autor (5 min).
const GROUP_WINDOW_MS = 5 * 60 * 1000;

/** Pet do OUTRO dono no match (mesma derivação usada na lista de matches). */
function otherPet(match: Match, me: string): MatchPet {
  return match.summary.ownerA.ownerId === me ? match.summary.petB : match.summary.petA;
}

/** Timestamp ISO -> "HH:MM" (vazio se não houver/!inválido). */
function timeLabel(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Rótulo de dia para o separador ("Hoje" / "Ontem" / data). */
function dayLabel(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'Hoje';
  if (sameDay(d, yest)) return 'Ontem';
  return d.toLocaleDateString([], { day: '2-digit', month: 'long' });
}

/** Chave de dia (YYYY-MM-DD) p/ detectar troca de data entre mensagens. */
function dayKey(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

/** Uma mensagem já decorada com flags de agrupamento/separador para render. */
interface DecoratedMessage extends Message {
  mine: boolean;
  /** Primeira mensagem de uma sequência do mesmo autor (mostra avatar/nome). */
  firstOfRun: boolean;
  /** Última mensagem de uma sequência (mostra o horário e o "rabo" da bolha). */
  lastOfRun: boolean;
  /** Rótulo de dia a exibir ANTES desta mensagem (separador), se houver. */
  daySeparator: string | null;
}

/** Decora a lista crua com agrupamento por autor/tempo e separadores de dia. */
function decorate(messages: Message[], me: string): DecoratedMessage[] {
  return messages.map((m, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const mine = m.senderId === me;

    const sameAuthor = (a?: Message, b?: Message) => !!a && !!b && a.senderId === b.senderId;
    const closeInTime = (a?: Message, b?: Message) => {
      if (!a?.createdAt || !b?.createdAt) return true; // sem tempo: agrupa por autor
      return (
        Math.abs(new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) <=
        GROUP_WINDOW_MS
      );
    };

    const firstOfRun = !sameAuthor(prev, m) || !closeInTime(prev, m);
    const lastOfRun = !sameAuthor(m, next) || !closeInTime(m, next);

    const prevDay = dayKey(prev?.createdAt);
    const thisDay = dayKey(m.createdAt);
    const daySeparator = thisDay && thisDay !== prevDay ? dayLabel(m.createdAt) : null;

    return { ...m, mine, firstOfRun, lastOfRun, daySeparator };
  });
}

/** Conversa de um match (lista de mensagens + envio). */
export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const me = currentOwnerId();
  const [messages, setMessages] = useState<Message[]>([]);
  const [peer, setPeer] = useState<MatchPet | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const peerName = peer?.name ?? 'seu match';
  const peerEmoji = emojiFor(peer?.species ?? '');

  async function load() {
    if (!id) return;
    try {
      setMessages(await fetchMessages(id));
      // Abrir a conversa marca as mensagens como lidas no backend: avisa a
      // TopBar para zerar o badge de notificações na hora.
      window.dispatchEvent(new Event('petmatch:unread-changed'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar a conversa.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Identidade do interlocutor: fetchMessages não traz o resumo do match, então
  // buscamos a lista de matches (mesma derivação da MatchesPage) p/ o cabeçalho.
  useEffect(() => {
    if (!id) return;
    let active = true;
    fetchMatches()
      .then((matches) => {
        if (!active) return;
        const match = matches.find((mt) => mt.id === id);
        if (match) setPeer(otherPet(match, me));
      })
      .catch(() => {
        /* cabeçalho é best-effort; o chat funciona sem ele */
      });
    return () => {
      active = false;
    };
  }, [id, me]);

  // Recebimento "ao vivo": revalida as mensagens em intervalos curtos enquanto
  // o chat está aberto. Mensagens novas do outro lado entram sem recarregar.
  useEffect(() => {
    if (!id) return;
    const timer = window.setInterval(() => {
      fetchMessages(id)
        // Só re-renderiza quando há mensagem nova (evita "pular" o scroll à toa).
        .then((msgs) => setMessages((prev) => (msgs.length !== prev.length ? msgs : prev)))
        .catch(() => {
          /* polling é best-effort; ignora falhas transitórias de rede */
        });
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value || !id) return;
    setSending(true);
    try {
      const msg = await sendMessage(id, value);
      setMessages((m) => [...m, msg]);
      setText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar.');
    } finally {
      setSending(false);
    }
  }

  const decorated = useMemo(() => decorate(messages, me), [messages, me]);

  return (
    <div className="app chat">
      <TopBar
        actions={
          <button
            className="icon-btn"
            onClick={() => navigate('/matches')}
            title="Voltar aos matches"
            aria-label="Voltar aos matches"
          >
            <ArrowLeft aria-hidden />
          </button>
        }
      />

      {/* Identidade do interlocutor: deixa explícito COM QUEM se está falando. */}
      <div className="chat-peer">
        <div className="chat-peer-avatar" aria-hidden>
          {peer?.mainPhotoUrl ? <img src={peer.mainPhotoUrl} alt="" /> : <span>{peerEmoji}</span>}
        </div>
        <div className="chat-peer-meta">
          <strong>{peerName}</strong>
          {peer?.species && <span>{peer.species}</span>}
        </div>
      </div>

      <div
        className="chat-body"
        role="log"
        aria-live="polite"
        aria-label={`Conversa com ${peerName}`}
      >
        {loading && <p className="list-hint">Carregando…</p>}
        {!loading && error && <div className="form-error">{error}</div>}
        {!loading && !error && messages.length === 0 && (
          <div className="empty-inline">
            <div className="big">👋</div>
            <h3>Diga olá!</h3>
            <p>Esta é a primeira mensagem com {peerName}. Quebre o gelo 🐾</p>
          </div>
        )}

        {!loading &&
          !error &&
          decorated.map((m) => (
            <div key={m.id}>
              {m.daySeparator && (
                <div className="chat-day">
                  <span>{m.daySeparator}</span>
                </div>
              )}
              <div
                className={`msg-row ${m.mine ? 'mine' : 'theirs'}${m.firstOfRun ? ' first' : ''}${
                  m.lastOfRun ? ' last' : ''
                }`}
              >
                {/* Gutter do avatar (só o interlocutor; preenche no 1º da sequência). */}
                {!m.mine && (
                  <div className="msg-avatar" aria-hidden>
                    {m.firstOfRun ? (
                      peer?.mainPhotoUrl ? (
                        <img src={peer.mainPhotoUrl} alt="" />
                      ) : (
                        <span>{peerEmoji}</span>
                      )
                    ) : null}
                  </div>
                )}

                <div className="msg-col">
                  {m.firstOfRun && (
                    <span className="msg-name">{m.mine ? 'Você' : peerName}</span>
                  )}
                  <div className={`bubble ${m.mine ? 'me' : 'them'}`}>
                    {/* Prefixo de autor só p/ leitores de tela (WCAG: não só cor). */}
                    <span className="sr-only">{m.mine ? 'Você: ' : `${peerName}: `}</span>
                    {m.text}
                  </div>
                  {m.lastOfRun && timeLabel(m.createdAt) && (
                    <span className="msg-time">{timeLabel(m.createdAt)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        <div ref={endRef} />
      </div>

      <form className="chat-input" onSubmit={handleSend}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Escreva para ${peerName}…`}
          maxLength={2000}
          aria-label="Mensagem"
        />
        <button type="submit" className="btn-pill" disabled={sending || !text.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}
