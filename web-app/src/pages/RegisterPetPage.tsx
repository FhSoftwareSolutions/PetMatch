import { useState, type ChangeEvent, type FormEvent } from 'react';
import { createPet, uploadPhoto, type NewPet, type Pet } from '../services/api';
import { CITIES, GENDERS, SEEKINGS, SIZES, SPECIES } from '../lib/options';
import { isLoggedIn } from '../lib/session';
import { PawPrint, MapPin, X } from 'lucide-react';

interface RegisterPetPageProps {
  /** Quando true, é o cadastro inicial (mostra boas-vindas e "pular"). */
  isOnboarding: boolean;
  /** Chamado após cadastrar com sucesso. */
  onDone: (pet: Pet) => void;
  /** Chamado ao pular/cancelar (volta para o feed). */
  onCancel: () => void;
}

/**
 * Formulário de cadastro de pet. Validação leve no cliente e envio para a API
 * (`POST /pets`); ao concluir, devolve o pet criado via `onDone`.
 */
export default function RegisterPetPage({ isOnboarding, onDone, onCancel }: RegisterPetPageProps) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState(SPECIES[0]);
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState(GENDERS[0].value);
  const [ageValue, setAgeValue] = useState('');
  const [ageUnit, setAgeUnit] = useState<'anos' | 'meses'>('anos');
  const [size, setSize] = useState(SIZES[1].value); // médio por padrão
  const [seeking, setSeeking] = useState(SEEKINGS[0].value);
  const [city, setCity] = useState(CITIES[0]);
  const [photo, setPhoto] = useState('');
  const [photoOk, setPhotoOk] = useState(true);
  const [temperament, setTemperament] = useState('');
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Coordenadas GeoJSON [lng, lat] do dispositivo (opcional).
  const [geo, setGeo] = useState<[number, number] | null>(null);
  const [geoMsg, setGeoMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  /** Faz upload do arquivo escolhido e usa a URL retornada como foto. */
  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadPhoto(file);
      setPhoto(url);
      setPhotoOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar a foto.');
    } finally {
      setUploading(false);
    }
  }

  /** Captura a localização do dispositivo (com permissão do usuário). */
  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoMsg('Geolocalização indisponível neste navegador.');
      return;
    }
    setGeoMsg('Obtendo localização…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo([pos.coords.longitude, pos.coords.latitude]);
        setGeoMsg('Localização capturada ✓');
      },
      () => setGeoMsg('Não foi possível obter a localização.'),
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const ageNum = Number(ageValue);
    if (!name.trim()) {
      setError('Informe o nome do pet.');
      return;
    }
    if (!ageValue || Number.isNaN(ageNum) || ageNum < 0) {
      setError('Informe uma idade válida.');
      return;
    }
    const ageMonths = ageUnit === 'anos' ? Math.round(ageNum * 12) : Math.round(ageNum);
    if (ageMonths > 360) {
      setError('Idade máxima: 30 anos.');
      return;
    }
    if (photo.trim()) {
      // Valida a URL no cliente para evitar um 400 do backend (@IsUrl).
      try {
        new URL(photo.trim());
      } catch {
        setError('Informe uma URL de foto válida (ex.: https://...).');
        return;
      }
    }

    // Monta o payload omitindo os opcionais vazios (evita falhar a validação).
    const payload: NewPet = {
      name: name.trim(),
      species,
      gender: gender as NewPet['gender'],
      ageMonths,
      size: size as NewPet['size'],
      seeking: seeking as NewPet['seeking'],
      city,
    };
    if (breed.trim()) payload.breed = breed.trim();
    if (bio.trim()) payload.bio = bio.trim();
    if (photo.trim()) payload.mainPhotoUrl = photo.trim();
    // Separa por vírgula e remove duplicatas (evita keys repetidas nas tags).
    const temps = [
      ...new Set(
        temperament
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      ),
    ];
    if (temps.length) payload.temperament = temps;
    if (geo) payload.location = { type: 'Point', coordinates: geo };

    setSubmitting(true);
    try {
      const pet = await createPet(payload);
      onDone(pet);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar o pet.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app register">
      <header>
        <div className="brand">
          <span className="pin"><PawPrint aria-hidden /></span>
          <b>Pet</b>
          <i>Match</i>
        </div>
        {!isOnboarding && (
          <button className="icon-btn" onClick={onCancel} title="Voltar" aria-label="Voltar">
            <X aria-hidden />
          </button>
        )}
      </header>

      <div className="register-body">
        <h1 className="register-title">{isOnboarding ? 'Cadastre seu pet 🐾' : 'Novo pet'}</h1>
        <p className="register-sub">
          {isOnboarding
            ? 'Conte quem é seu melhor amigo para começar a encontrar matches.'
            : 'Adicione mais um pet ao PetMatch.'}
        </p>

        <form className="form" onSubmit={handleSubmit}>
          {photo.trim() && photoOk && (
            <img
              className="photo-preview"
              src={photo.trim()}
              alt="Prévia da foto"
              onError={() => setPhotoOk(false)}
            />
          )}

          <label className="field">
            <span>Nome*</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Thor"
              maxLength={40}
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Espécie*</span>
              <select value={species} onChange={(e) => setSpecies(e.target.value)}>
                {SPECIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Raça</span>
              <input
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="Ex.: Labrador (ou SRD)"
                maxLength={60}
              />
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>Sexo*</span>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Idade*</span>
              <div className="age-input">
                <input
                  type="number"
                  min="0"
                  value={ageValue}
                  onChange={(e) => setAgeValue(e.target.value)}
                  placeholder="0"
                />
                <select
                  value={ageUnit}
                  onChange={(e) => setAgeUnit(e.target.value as 'anos' | 'meses')}
                  aria-label="Unidade de idade"
                >
                  <option value="anos">anos</option>
                  <option value="meses">meses</option>
                </select>
              </div>
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>Porte*</span>
              <select value={size} onChange={(e) => setSize(e.target.value)}>
                {SIZES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
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
          </div>

          <div className="geo-row">
            <button type="button" className="btn-ghost-dark" onClick={useMyLocation}>
              <MapPin className="ic-inline" aria-hidden /> Usar minha localização
            </button>
            {geoMsg && <span className="geo-msg">{geoMsg}</span>}
          </div>

          <label className="field">
            <span>Procura por*</span>
            <select value={seeking} onChange={(e) => setSeeking(e.target.value)}>
              {SEEKINGS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Foto</span>
            <input
              value={photo}
              onChange={(e) => {
                setPhoto(e.target.value);
                setPhotoOk(true);
              }}
              placeholder="https://… (cole uma URL ou envie um arquivo)"
            />
            {isLoggedIn() ? (
              <div className="geo-row">
                <input type="file" accept="image/*" onChange={onPickFile} disabled={uploading} />
                {uploading && <span className="geo-msg">Enviando…</span>}
              </div>
            ) : (
              <span className="auth-hint">Entre na sua conta para enviar arquivos (ou cole uma URL acima).</span>
            )}
          </label>

          <label className="field">
            <span>Temperamento</span>
            <input
              value={temperament}
              onChange={(e) => setTemperament(e.target.value)}
              placeholder="brincalhão, dócil (separe por vírgula)"
            />
          </label>

          <label className="field">
            <span>Bio</span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={280}
              placeholder="Conte um pouco sobre o pet…"
            />
          </label>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Salvando…' : 'Cadastrar pet'}
            </button>
            <button type="button" className="btn-ghost-dark" onClick={onCancel} disabled={submitting}>
              {isOnboarding ? 'Pular por agora' : 'Cancelar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
