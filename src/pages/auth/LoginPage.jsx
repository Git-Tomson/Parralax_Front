import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from 'src/context/AuthContext';
import { useNetworkStatus } from 'src/hooks/useNetworkStatus';
import { extractErrorMessage } from 'src/api/client';
import { Lock, User, ArrowRight, Cpu, Network, BarChart2, Eye, EyeOff, WifiOff } from 'lucide-react';

function FeatureBullet({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-white text-sm font-medium">{title}</p>
        <p className="text-slate-400 text-xs mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { isOnline } = useNetworkStatus();
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    if (!isOnline) {
      setApiError('Aucune connexion réseau. Vérifiez votre connexion et réessayez.');
      return;
    }
    setApiError('');
    try {
      const user = await login({
        username: data.username.trim(),
        password: data.password,
      });
      navigate(user.role === 'gestionnaire' ? '/cluster' : '/dashboard', { replace: true });
    } catch (err) {
      const status = err.response?.status;
      if (status === 400 || status === 401) {
        setApiError('Identifiants incorrects. Vérifiez votre nom d\'utilisateur et mot de passe.');
      } else {
        setApiError(extractErrorMessage(err));
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[55%] flex-col bg-slate-900 circuit-bg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900/50 to-slate-900 pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#60a5fa 1px, transparent 1px), linear-gradient(90deg, #60a5fa 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full p-12">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src="/logo_enspy.jpg" alt="ENSPY" className="w-14 h-14 rounded-xl object-cover ring-2 ring-blue-500/50 shadow-xl" />
              <div className="absolute inset-0 rounded-xl bg-blue-500/10" />
            </div>
            <div>
              <p className="text-blue-400 text-xs font-bold tracking-widest uppercase">
                École Nationale Supérieure Polytechnique de Yaoundé
              </p>
              <p className="text-slate-400 text-xs mt-0.5">Département Informatique</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-8">
              <div className="flex items-end gap-4 mb-3">
                <h1 className="text-7xl font-black text-white tracking-tighter leading-none">PARALLAX</h1>
                <div className="mb-2">
                  <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-400/40 rounded text-blue-300 text-xs font-bold tracking-wider">v2.0</span>
                </div>
              </div>
              <p className="text-slate-300 text-lg font-light tracking-wide">Portail de Calcul Distribué Haute Performance</p>
              <p className="text-slate-500 text-sm mt-2">Décomposition et exécution parallèle de programmes scientifiques sur cluster ENSPY</p>
            </div>

            <div className="space-y-4 mb-10">
              <FeatureBullet icon={<Cpu size={15} className="text-blue-400" />} title="Orchestration de Cluster" desc="Gestion automatique des nœuds avec équilibrage de charge dynamique et score d'élection" />
              <FeatureBullet icon={<Network size={15} className="text-emerald-400" />} title="Heartbeat & Tolérance aux pannes" desc="Surveillance unicast T=2s, migration automatique des tâches, retry ×3" />
              <FeatureBullet icon={<BarChart2 size={15} className="text-violet-400" />} title="Monitoring temps réel" desc="Métriques CPU/RAM, logs d'exécution, progression tâche par tâche" />
            </div>

            <div className="flex gap-8">
              {[{ value: 'MPI', label: 'Protocole' }, { value: '≤2s', label: 'Heartbeat' }, { value: '3×', label: 'Retry max' }].map((s) => (
                <div key={s.label}>
                  <p className="text-white text-2xl font-black">{s.value}</p>
                  <p className="text-slate-500 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-slate-600 text-xs">© 2025 ENSPY · Projet PARALLAX</p>
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
              <span>Système opérationnel</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 py-12 relative">
        {/* Offline banner */}
        {!isOnline && (
          <div className="absolute top-4 left-4 right-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
            <WifiOff size={14} className="shrink-0" />
            Hors ligne — impossible de se connecter sans réseau.
          </div>
        )}

        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-3 mb-8">
          <img src="/logo_enspy.jpg" alt="ENSPY" className="w-10 h-10 rounded-lg object-cover" />
          <div>
            <p className="font-black text-xl tracking-wider">PARALLAX</p>
            <p className="text-slate-500 text-xs">ENSPY · HPC Portal</p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Connexion</h2>
            <p className="text-slate-500 text-sm mt-1">Accédez au portail de calcul distribué PARALLAX</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={15} className={errors.username ? 'text-red-400' : 'text-slate-400'} />
                </div>
                <input
                  {...register('username', {
                    required: 'Identifiant requis.',
                    minLength: { value: 2, message: 'Minimum 2 caractères.' },
                  })}
                  className={`w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm transition-all bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 ${
                    errors.username
                      ? 'border-red-300 focus:ring-red-300'
                      : 'border-slate-200 focus:ring-blue-500 focus:border-transparent'
                  }`}
                  placeholder="votre_identifiant"
                  autoComplete="username"
                  autoFocus
                />
              </div>
              {errors.username && <p className="text-red-500 text-xs mt-1 flex items-center gap-1">⚠ {errors.username.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={15} className={errors.password ? 'text-red-400' : 'text-slate-400'} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Mot de passe requis.',
                    minLength: { value: 4, message: 'Minimum 4 caractères.' },
                  })}
                  className={`w-full pl-9 pr-10 py-2.5 border rounded-lg text-sm transition-all bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 ${
                    errors.password
                      ? 'border-red-300 focus:ring-red-300'
                      : 'border-slate-200 focus:ring-blue-500 focus:border-transparent'
                  }`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1 flex items-center gap-1">⚠ {errors.password.message}</p>}
            </div>

            {/* API Error */}
            {apiError && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-lg">
                <span className="text-red-500 mt-0.5 shrink-0">⚠</span>
                <span>{apiError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !isOnline}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-semibold text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Connexion…</>
              ) : (
                <>Se connecter<ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:underline">Créer un compte</Link>
            </p>
          </div>

          <div className="mt-5 flex items-center justify-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400'}`} />
              {isOnline ? 'Cluster actif' : 'Hors ligne'}
            </div>
            <span>·</span>
            <span>ENSPY · 2025</span>
          </div>
        </div>
      </div>
    </div>
  );
}
