/**
 * Efeitos sonoros do swipe, sintetizados na hora com a Web Audio API.
 *
 * Não usamos arquivos de áudio: dois "blips" curtos por gesto. Curtir = duas
 * notas ascendentes (positivo); passar = duas notas graves descendentes
 * (negativo). O AudioContext é criado de forma preguiçosa no primeiro gesto do
 * usuário (clique/arraste), respeitando as políticas de autoplay do navegador.
 */

type WindowWithWebkit = typeof window & { webkitAudioContext?: typeof AudioContext };

let ctx: AudioContext | null = null;

/** Obtém (ou cria) o AudioContext, resumindo-o se o navegador o suspendeu. */
function getCtx(): AudioContext | null {
  try {
    const Ctor = window.AudioContext ?? (window as WindowWithWebkit).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Toca uma nota curta com envelope suave (evita o "clique" de corte). */
function blip(
  ac: AudioContext,
  freq: number,
  startAt: number,
  dur: number,
  type: OscillatorType,
  peak = 0.16,
): void {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(startAt);
  osc.stop(startAt + dur + 0.02);
}

/** Toca o som correspondente à direção do swipe. */
export function playSwipe(dir: 'like' | 'nope'): void {
  const ac = getCtx();
  if (!ac) return;
  const t = ac.currentTime;
  if (dir === 'like') {
    blip(ac, 587.33, t, 0.12, 'triangle'); // D5
    blip(ac, 880.0, t + 0.09, 0.18, 'triangle'); // A5 — sobe = "gostei"
  } else {
    blip(ac, 311.13, t, 0.12, 'sawtooth', 0.12); // Eb4
    blip(ac, 196.0, t + 0.07, 0.2, 'sine', 0.14); // G3 — desce = "passar"
  }
}
