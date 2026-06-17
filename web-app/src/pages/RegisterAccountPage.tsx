import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerAccount } from '../services/api';
import { CITIES } from '../lib/options';

/** Tela de criação de conta. */
export default function RegisterAccountPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState(CITIES[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.');
      return;
    }
    setSubmitting(true);
    try {
      await registerAccount({ name: name.trim(), email: email.trim(), password, city });
      navigate('/perfil');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar a conta.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app register">
      <header>
        <div className="brand">
          <span className="pin">🐾</span>
          <b>Pet</b>
          <i>Match</i>
        </div>
        <button className="icon-btn" onClick={() => navigate('/')} title="Voltar" aria-label="Voltar">
          ✕
        </button>
      </header>

      <div className="register-body">
        <h1 className="register-title">Criar conta</h1>
        <p className="register-sub">Para guardar seus pets e conversas.</p>

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Nome</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
          </label>
          <label className="field">
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              autoComplete="email"
            />
          </label>
          <label className="field">
            <span>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="mínimo 6 caracteres"
              autoComplete="new-password"
            />
          </label>
          <label className="field">
            <span>Cidade</span>
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Criando…' : 'Criar conta'}
            </button>
            <p className="auth-switch">
              Já tem conta? <Link to="/login">Entrar</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
