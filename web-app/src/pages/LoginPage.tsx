import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/api';

/** Tela de login (e-mail + senha). */
export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate('/perfil');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar.');
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
        <h1 className="register-title">Entrar</h1>
        <p className="register-sub">Acesse sua conta para ver seus matches em qualquer lugar.</p>

        <form className="form" onSubmit={handleSubmit}>
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
              placeholder="••••••"
              autoComplete="current-password"
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Entrando…' : 'Entrar'}
            </button>
            <p className="auth-switch">
              Não tem conta? <Link to="/cadastro">Criar conta</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
