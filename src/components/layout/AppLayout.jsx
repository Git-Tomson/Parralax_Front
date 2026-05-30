import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from 'src/context/AuthContext';
import { useNetworkStatus } from 'src/hooks/useNetworkStatus';
import {
  LayoutDashboard, Server, FileCode2, Upload, LogOut,
  Activity, Clock, ChevronRight, Wifi, WifiOff,
  CheckCircle2, RefreshCw,
} from 'lucide-react';

function SidebarSection({ title, children }) {
  return (
    <div className="mb-4">
      <p className="px-3 mb-1 text-[10px] font-semibold text-blue-400/50 uppercase tracking-widest select-none">
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarLink({ to, icon, children, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `sidebar-link flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium ${
          isActive
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
            : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
        }`
      }
    >
      <span className="shrink-0">{icon}</span>
      <span>{children}</span>
    </NavLink>
  );
}

function TopBar({ user }) {
  const [time, setTime] = useState(new Date());
  const location = useLocation();
  const { isOnline, wasOffline } = useNetworkStatus();

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = time.toLocaleTimeString('fr-FR', { hour12: false });

  const breadcrumb = (() => {
    const p = location.pathname;
    if (p.startsWith('/cluster/nodes/'))        return [{ label: 'Cluster', to: '/cluster' }, { label: 'Nœud' }];
    if (p === '/cluster/programmes')            return [{ label: 'Cluster', to: '/cluster' }, { label: 'Programmes' }];
    if (p.startsWith('/cluster/programmes/'))   return [{ label: 'Cluster', to: '/cluster' }, { label: 'Programmes', to: '/cluster/programmes' }, { label: 'Détail' }];
    if (p === '/cluster')                       return [{ label: 'Cluster' }];
    if (p === '/dashboard')                     return [{ label: 'Mes Projets' }];
    if (p === '/programmes/import')             return [{ label: 'Mes Projets', to: '/dashboard' }, { label: 'Importer' }];
    if (p.startsWith('/programmes/'))           return [{ label: 'Mes Projets', to: '/dashboard' }, { label: 'Détail' }];
    return [];
  })();

  return (
    <>
      {/* Offline / reconnected banner */}
      {!isOnline && (
        <div className="bg-red-600 text-white text-xs px-4 py-1.5 flex items-center gap-2 font-medium">
          <WifiOff size={12} />
          Connexion perdue — les données ne se rafraîchissent plus. Vérifiez votre réseau.
        </div>
      )}
      {isOnline && wasOffline && (
        <div className="bg-emerald-600 text-white text-xs px-4 py-1.5 flex items-center gap-2 font-medium">
          <CheckCircle2 size={12} />
          Connexion rétablie — rafraîchissement en cours…
        </div>
      )}

      <header className="h-11 bg-slate-800/95 border-b border-slate-700/60 flex items-center px-6 gap-4 shrink-0 backdrop-blur-sm">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs flex-1 min-w-0">
          <span className="text-slate-500 font-semibold tracking-wide">PARALLAX</span>
          {breadcrumb.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <ChevronRight size={11} className="text-slate-600" />
              {crumb.to ? (
                <NavLink to={crumb.to} className="text-slate-400 hover:text-white transition-colors">
                  {crumb.label}
                </NavLink>
              ) : (
                <span className="text-white font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>

        {/* Network status */}
        <div className={`flex items-center gap-1.5 text-xs ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
          {isOnline
            ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" /><span className="hidden sm:inline">Live</span></>
            : <><WifiOff size={12} /><span className="hidden sm:inline">Hors ligne</span></>
          }
        </div>

        {/* Clock */}
        <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
          <Clock size={11} />
          <span>{timeStr}</span>
        </div>

        {/* User */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-700">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold select-none">
            {user?.username?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="hidden md:block">
            <span className="text-slate-300 text-xs font-medium">{user?.username}</span>
            <span className="text-slate-500 text-xs ml-1">
              · {user?.role === 'etudiant' ? 'Étudiant' : user?.role === 'chercheur' ? 'Chercheur' : 'Gestionnaire'}
            </span>
          </div>
        </div>
      </header>
    </>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isGestionnaire = user?.role === 'gestionnaire';
  const roleLabel = user?.role === 'etudiant' ? 'Étudiant' : user?.role === 'chercheur' ? 'Chercheur' : 'Gestionnaire';
  const sectionTitle = user?.role === 'etudiant' ? 'Espace Étudiant' : 'Espace Chercheur';

  return (
    <div className="flex min-h-screen bg-[#f0f4f8]">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 flex flex-col shrink-0 shadow-2xl border-r border-slate-800">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src="/logo_enspy.jpg"
                alt="ENSPY"
                className="w-9 h-9 rounded-lg object-cover ring-2 ring-blue-500/40"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 pulse-dot" />
            </div>
            <div className="min-w-0">
              <p className="text-white font-black text-base tracking-[0.2em] leading-tight">PARALLAX</p>
              <p className="text-blue-400/70 text-[9px] font-semibold tracking-widest uppercase truncate">
                HPC · ENSPY
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          {isGestionnaire ? (
            <>
              <SidebarSection title="Cluster">
                <SidebarLink to="/cluster" end icon={<Server size={15} />}>Vue d'ensemble</SidebarLink>
                <SidebarLink to="/cluster/programmes" icon={<FileCode2 size={15} />}>Programmes</SidebarLink>
              </SidebarSection>
              <SidebarSection title="Administration">
                <SidebarLink to="/cluster/programmes" icon={<Activity size={15} />}>Programmes</SidebarLink>
              </SidebarSection>
            </>
          ) : (
            <SidebarSection title={sectionTitle}>
              <SidebarLink to="/dashboard" end icon={<LayoutDashboard size={15} />}>Mes Projets</SidebarLink>
              <SidebarLink to="/programmes/import" icon={<Upload size={15} />}>Nouveau Projet</SidebarLink>
            </SidebarSection>
          )}

          {/* Info système */}
          <div className="mt-4 mx-1 px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs mb-0.5">
              <Wifi size={10} />
              <span>Cluster PARALLAX</span>
            </div>
            <p className="text-slate-500 text-[10px]">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </nav>

        {/* User section */}
        <div className="px-2 py-3 border-t border-slate-800">
          <div className="px-2 py-2 mb-1 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 select-none">
                <span className="text-white text-xs font-bold">{user?.username?.[0]?.toUpperCase() ?? '?'}</span>
              </div>
              <div className="min-w-0">
                <p className="text-slate-200 text-xs font-semibold truncate">{user?.username}</p>
                <p className="text-blue-400/60 text-[10px]">{roleLabel}</p>
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="sidebar-link w-full flex items-center gap-2 px-2 py-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-xs transition-colors"
          >
            <LogOut size={13} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <TopBar user={user} />
        <main className="flex-1 overflow-auto">
          <div className="p-6 page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
