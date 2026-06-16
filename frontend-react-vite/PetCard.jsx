import { useRef, useState, forwardRef, useImperativeHandle } from 'react'

const PetCard = forwardRef(function PetCard({ pet, isTop, depth, onSwipe }, ref) {
  const cardRef = useRef(null)
  const drag = useRef({ active: false, startX: 0, startY: 0, dx: 0 })
  const [overlay, setOverlay] = useState(0) // -1 nope, +1 like, 0 none

  const baseTransform = `translateY(${depth * 10}px) scale(${1 - depth * 0.04})`

  function leave(dir) {
    const el = cardRef.current
    const toX = dir === 'like' ? 600 : -600
    el.style.transition = 'transform .4s ease'
    el.style.transform = `translate(${toX}px,-40px) rotate(${dir === 'like' ? 28 : -28}deg)`
    setTimeout(() => onSwipe(dir, pet), 280)
  }

  // permite que os botoes da ActionBar disparem o swipe do card de cima
  useImperativeHandle(ref, () => ({ flick: leave }), [pet])

  function onPointerDown(e) {
    if (!isTop) return
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, dx: 0 }
    cardRef.current.style.transition = 'none'
    cardRef.current.setPointerCapture(e.pointerId)
  }
  function onPointerMove(e) {
    if (!drag.current.active) return
    const dx = e.clientX - drag.current.startX
    const dy = e.clientY - drag.current.startY
    drag.current.dx = dx
    cardRef.current.style.transform = `translate(${dx}px,${dy}px) rotate(${dx / 18}deg)`
    setOverlay(dx > 30 ? 1 : dx < -30 ? -1 : 0)
  }
  function onPointerUp() {
    if (!drag.current.active) return
    drag.current.active = false
    const { dx } = drag.current
    if (Math.abs(dx) > 110) {
      leave(dx > 0 ? 'like' : 'nope')
    } else {
      cardRef.current.style.transition = 'transform .25s ease'
      cardRef.current.style.transform = baseTransform
      setOverlay(0)
    }
  }

  return (
    <div
      ref={cardRef}
      className="card"
      style={{ transform: baseTransform, zIndex: 10 - depth }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="photo" style={{ background: `linear-gradient(150deg, ${pet.bg[0]}, ${pet.bg[1]})` }}>
        <div className="emoji">{pet.emoji}</div>
        <div className="scrim" />
        <div className="stamp like" style={{ opacity: overlay === 1 ? 1 : 0 }}>Adotar</div>
        <div className="stamp nope" style={{ opacity: overlay === -1 ? 1 : 0 }}>Passar</div>
        <div className="info">
          <h2>{pet.name} <span>{pet.age}</span></h2>
          <div className="meta">📍 {pet.dist} • {pet.type}</div>
          <div className="bio">{pet.bio}</div>
          <div className="tags">
            {pet.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
          </div>
        </div>
      </div>
    </div>
  )
})

export default PetCard
