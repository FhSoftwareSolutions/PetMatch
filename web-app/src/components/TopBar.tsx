import { NavLink } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import { Compass, Heart, User, PawPrint } from 'lucide-react';
import { fetchUnreadCount } from '../services/api';

/** Intervalo de atualização do badge de mensagens não lidas. */
const UNREAD_POLL_MS = 5000;

interface TopBarProps {
  /** Botões de ação específicos da página, exibidos à direita da barra. */
  actions?: ReactNode;
}

/**
 * Barra de topo compartilhada (layout desktop).
 *
 * Marca à esquerda, navegação principal (Descobrir / Matches / Perfil) e um
 * espaço opcional para ações da página. O item "Matches" exibe um badge com o
 * total de mensagens não lidas, atualizado por polling e imediatamente quando
 * uma conversa é aberta (evento `petmatch:unread-changed`). A navegação usa
 * NavLink, que marca o link ativo com `aria-current="page"`.
 */
export default function TopBar({ actions }: TopBarProps) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    const refresh = () =>
      fetchUnreadCount()
        .then((n) => {
          if (active) setUnread(n);
        })
        .catch(() => {
          /* badge é informativo; ignora falhas de rede */
        });
    void refresh();
    const timer = window.setInterval(refresh, UNREAD_POLL_MS);
    // Atualiza na hora quando o chat marca mensagens como lidas.
    window.addEventListener('petmatch:unread-changed', refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('petmatch:unread-changed', refresh);
    };
  }, []);

  return (
    <header className="topbar">
      <NavLink to="/" end className="brand" aria-label="PetMatch — início">
        <span className="pin"><PawPrint aria-hidden /></span>
        <b>Pet</b>
        <i>Match</i>
      </NavLink>

      <nav className="topnav">
        <NavLink to="/" end className="navlink">
          <span className="ic" aria-hidden><Compass /></span>
          <span className="lbl">Descobrir</span>
        </NavLink>
        <NavLink to="/matches" className="navlink">
          <span className="ic" aria-hidden><Heart /></span>
          <span className="lbl">Matches</span>
          {unread > 0 && (
            <span className="nav-badge" aria-label={`${unread} mensagens não lidas`}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </NavLink>
        <NavLink to="/perfil" className="navlink">
          <span className="ic" aria-hidden><User /></span>
          <span className="lbl">Perfil</span>
        </NavLink>
      </nav>

      {actions && <div className="header-actions">{actions}</div>}
    </header>
  );
}
