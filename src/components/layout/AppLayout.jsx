import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from 'src/context/AuthContext';

function SidebarLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-4 py-2.5 rounded text-sm transition-colors ${
          isActive ? 'bg-white text-black font-semibold' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const isGestionnaire = user?.role === 'gestionnaire';

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-black flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-gray-800">
          <p className="text-white font-bold text-base tracking-wide">PARALLAX</p>
          <p className="text-gray-400 text-xs mt-0.5">{user?.username}</p>
          <p className="text-gray-500 text-xs capitalize">{user?.role}</p>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {isGestionnaire ? (
            <>
              <SidebarLink to="/cluster">Cluster</SidebarLink>
              <SidebarLink to="/cluster/programmes">Programmes</SidebarLink>
            </>
          ) : (
            <>
              <SidebarLink to="/dashboard">Mes projets</SidebarLink>
              <SidebarLink to="/programmes/import">Nouveau projet</SidebarLink>
            </>
          )}
        </nav>
        <div className="px-2 py-4 border-t border-gray-800">
          <button
            onClick={logout}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white rounded transition-colors"
          >
            Déconnexion
          </button>
        </div>
      </aside>
      <main className="flex-1 bg-gray-50 min-h-screen overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
