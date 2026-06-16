export default function ActionBar({ onNope, onLike, onRewind, canRewind }) {
  return (
    <div className="actions">
      <button className="fab sm rewind" onClick={onRewind} disabled={!canRewind} title="Voltar">↩</button>
      <button className="fab lg nope" onClick={onNope} title="Passar">✕</button>
      <button className="fab sm info" title="Detalhes">ℹ</button>
      <button className="fab lg like" onClick={onLike} title="Curtir">♥</button>
    </div>
  )
}
