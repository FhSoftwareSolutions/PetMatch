import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchMessages, sendMessage, type Message } from '../services/api';
import { currentOwnerId } from '../lib/session';

/** Conversa de um match (lista de mensagens + envio). */
export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const me = currentOwnerId();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function load() {
    if (!id) return;
    try {
      setMessages(await fetchMessages(id));
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

  return (
    <div className="app">
      <header>
        <button
          className="icon-btn"
          onClick={() => navigate('/matches')}
          title="Voltar"
          aria-label="Voltar"
        >
          ←
        </button>
        <div className="brand">
          <b>Conversa</b>
        </div>
        <span style={{ width: 42 }} />
      </header>

      <div className="chat-body">
        {loading && <p className="list-hint">Carregando…</p>}
        {!loading && error && <div className="form-error">{error}</div>}
        {!loading && !error && messages.length === 0 && (
          <p className="list-hint">Diga olá! 👋 Esta é a primeira mensagem.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.senderId === me ? 'me' : 'them'}`}>
            {m.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form className="chat-input" onSubmit={handleSend}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva uma mensagem…"
          maxLength={2000}
        />
        <button type="submit" className="btn-pill" disabled={sending || !text.trim()}>
          Enviar
        </button>
      </form>
    </div>
  );
}
