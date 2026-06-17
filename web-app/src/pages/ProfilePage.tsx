import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyPets, deletePet, type Pet } from '../services/api';
import { getAccount, clearSession, clearMyPet, getMyPet } from '../lib/session';
import { emojiFor, speciesLine } from '../lib/display';

/** Perfil: conta (login/logout) e gestão dos pets do usuário. */
export default function ProfilePage() {
  const navigate = useNavigate();
  const account = getAccount();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setPets(await fetchMyPets());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar seus pets.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function logout() {
    clearSession();
    navigate('/');
  }

  async function handleDelete(pet: Pet) {
    if (!window.confirm(`Excluir ${pet.name}?`)) return;
    try {
      await deletePet(pet.id);
      if (getMyPet()?.id === pet.id) clearMyPet();
      setPets((list) => list.filter((p) => p.id !== pet.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir.');
    }
  }

  return (
    <div className="app">
      <header>
        <div className="brand">
          <span className="pin">🐾</span>
          <b>Meu</b>
          <i>Perfil</i>
        </div>
        <button className="icon-btn" onClick={() => navigate('/')} title="Voltar" aria-label="Voltar">
          ←
        </button>
      </header>

      <div className="list-body">
        {/* Conta */}
        <section className="profile-card">
          {account ? (
            <>
              <div className="profile-account">
                <div className="match-avatar">
                  <span>👤</span>
                </div>
                <div className="match-meta">
                  <strong>{account.name}</strong>
                  <span>{account.email}</span>
                </div>
              </div>
              <button className="btn-ghost-dark" onClick={logout}>
                Sair
              </button>
            </>
          ) : (
            <>
              <p className="list-hint">Você está navegando sem conta.</p>
              <div className="form-actions">
                <button className="btn-primary" onClick={() => navigate('/login')}>
                  Entrar
                </button>
                <button className="btn-ghost-dark" onClick={() => navigate('/cadastro')}>
                  Criar conta
                </button>
              </div>
            </>
          )}
        </section>

        {/* Meus pets */}
        <div className="section-title">
          <span>Meus pets</span>
          <button className="btn-pill" onClick={() => navigate('/pets/novo')}>
            + Novo
          </button>
        </div>

        {loading && <p className="list-hint">Carregando…</p>}
        {!loading && error && <div className="form-error">{error}</div>}
        {!loading && !error && pets.length === 0 && (
          <p className="list-hint">Você ainda não cadastrou nenhum pet.</p>
        )}

        {!loading &&
          !error &&
          pets.map((pet) => (
            <div key={pet.id} className="match-row static">
              <div className="match-avatar">
                {pet.mainPhotoUrl ? (
                  <img src={pet.mainPhotoUrl} alt={pet.name} />
                ) : (
                  <span>{emojiFor(pet.species)}</span>
                )}
              </div>
              <div className="match-meta">
                <strong>{pet.name}</strong>
                <span>{speciesLine(pet)}</span>
              </div>
              <button
                className="icon-btn danger"
                onClick={() => handleDelete(pet)}
                title="Excluir"
                aria-label={`Excluir ${pet.name}`}
              >
                🗑
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
