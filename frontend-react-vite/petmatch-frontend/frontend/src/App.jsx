import { useRef, useState } from 'react'
import { PETS } from './data/pets'
import PetCard from './components/PetCard'
import ActionBar from './components/ActionBar'
import MatchModal from './components/MatchModal'

export default function App() {
  const [deck, setDeck] = useState(PETS)
  const [history, setHistory] = useState([])
  const [match, setMatch] = useState(null)
  const topCardRef = useRef(null)

  function handleSwipe(dir, pet) {
    setHistory((h) => [...h, pet])
    setDeck((d) => d.slice(1))
    if (dir === 'like' && Math.random() < 0.55) setMatch(pet)
  }

  function rewind() {
    setHistory((h) => {
      if (!h.length) return h
      const last = h[h.length - 1]
      setDeck((d) => [last, ...d])
      return h.slice(0, -1)
    })
  }

  function reset() {
    setDeck(PETS)
    setHistory([])
    setMatch(null)
  }

  // renderiza ate 3 cards; o de cima eh o primeiro do array
  const visible = deck.slice(0, 3)

  return (
    <div className="app">
      <header>
        <div className="brand"><span className="pin">🐾</span><b>Pet</b><i>Match</i></div>
        <button className="icon-btn" onClick={reset} title="Recomeçar">↻</button>
      </header>

      <div className="deck-wrap">
        <div className="deck">
          {visible.map((pet, i) => {
            const isTop = i === 0
            return (
              <PetCard
                key={pet.id}
                ref={isTop ? topCardRef : null}
                pet={pet}
                isTop={isTop}
                depth={i}
                onSwipe={handleSwipe}
              />
            )
          })}
        </div>

        {deck.length === 0 && (
          <div className="empty show">
            <div className="big">🦴</div>
            <h3>Por enquanto é só!</h3>
            <p>Você viu todos os pets perto de você. Volte mais tarde ou amplie sua busca.</p>
            <button onClick={reset}>Ver de novo</button>
          </div>
        )}
      </div>

      <ActionBar
        onNope={() => topCardRef.current?.flick('nope')}
        onLike={() => topCardRef.current?.flick('like')}
        onRewind={rewind}
        canRewind={history.length > 0}
      />

      <MatchModal
        pet={match}
        onKeep={() => setMatch(null)}
        onMessage={() => setMatch(null)}
      />
    </div>
  )
}
