export default function MatchModal({ pet, onKeep, onMessage }) {
  if (!pet) return null
  return (
    <div className="overlay show">
      <div className="matchface">{pet.emoji}</div>
      <div className="title">É um Match!</div>
      <div className="sub">Você e {pet.name} se curtiram. Que tal dar um lar pra ele?</div>
      <div className="row">
        <button className="primary" onClick={onMessage}>Falar com o tutor</button>
        <button className="ghost" onClick={onKeep}>Continuar buscando</button>
      </div>
    </div>
  )
}
