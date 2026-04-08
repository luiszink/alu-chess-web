import { NavLink } from 'react-router-dom';

export default function NavBar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded transition-colors text-sm font-medium ${
      isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
    }`;

  return (
    <nav className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center gap-4">
      <span className="text-white font-bold text-lg mr-4">♔ alu-chess</span>
      <NavLink to="/" className={linkClass}>
        Spielen
      </NavLink>
      <NavLink to="/history" className={linkClass}>
        Gespeicherte Spiele
      </NavLink>
    </nav>
  );
}
