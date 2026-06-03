import { NavLink } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/',            label: 'Startseite'  },
  { to: '/play',        label: 'Spiel'       },
  { to: '/history',     label: 'Verlauf'     },
  { to: '/performance', label: 'Performance' },
  { to: '/lichess',     label: 'Lichess'     },
  { to: '/tournament',  label: 'Tournament'  },
];

export default function NavBar() {
  return (
    <nav
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: '4px',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <NavLink
        to="/"
        style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px', textDecoration: 'none' }}
      >
        <span style={{ fontSize: '1.4rem', color: 'var(--heading)', lineHeight: 1 }}>♗</span>
        <span style={{ color: 'var(--heading)', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>
          alu-chess
        </span>
      </NavLink>

      {NAV_LINKS.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          style={({ isActive }) => ({
            padding: '5px 12px',
            borderRadius: '4px',
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
            color: isActive ? 'var(--heading)' : 'var(--muted)',
            background: isActive ? 'var(--card)' : 'transparent',
            transition: 'color 0.15s, background 0.15s',
          })}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            if (el.getAttribute('aria-current') !== 'page') {
              el.style.color = 'var(--text)';
            }
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement;
            if (el.getAttribute('aria-current') !== 'page') {
              el.style.color = 'var(--muted)';
            }
          }}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
