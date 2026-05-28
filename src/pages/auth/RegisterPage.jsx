import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { apiClient } from 'src/api/client';
import { User, Mail, Lock, Shield, ArrowRight, ChevronLeft } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { role: 'chercheur' } });

  const onSubmit = async (data) => {
    setApiError('');
    try {
      await apiClient.post('/api/auth/register', data);
      navigate('/login');
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        setApiError('Ce nom d\'utilisateur ou email est déjà utilisé.');
      } else if (status === 400) {
        setApiError(err.response?.data?.message ?? 'Données invalides.');
      } else {
        setApiError('Erreur serveur. Veuillez réessayer.');
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel – branding */}
      <div className="hidden lg:flex lg:w-[45%] flex-col bg-slate-900 circuit-bg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-slate-900/50 to-slate-900 pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#a78bfa 1px, transparent 1px), linear-gradient(90deg, #a78bfa 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full p-12">
          <div className="flex items-center gap-3">
            <img
              src="/logo_enspy.jpg"
              alt="ENSPY"
              className="w-11 h-11 rounded-xl object-cover ring-2 ring-violet-400/40"
            />
            <div>
              <p className="text-white font-black text-lg tracking-widest">PARALLAX</p>
              <p className="text-violet-400/70 text-[10px] tracking-widest uppercase">ENSPY · HPC Portal</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              Rejoignez<br />le cluster
            </h2>
            <p className="text-slate-400 text-base mb-8">
              Créez votre compte pour accéder à la plateforme de calcul distribué haute performance de l'ENSPY.
            </p>

            <div className="space-y-3">
              {[
                { icon: '🎓', label: 'Étudiant', desc: 'Exécutez vos TP et projets sur le cluster HPC' },
                { icon: '🔬', label: 'Chercheur', desc: 'Soumettez et suivez vos programmes de calcul' },
                { icon: '⚙️', label: 'Gestionnaire', desc: 'Administrez le cluster et ses ressources' },
              ].map((r) => (
                <div key={r.label} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <span className="text-xl">{r.icon}</span>
                  <div>
                    <p className="text-white text-sm font-semibold">{r.label}</p>
                    <p className="text-slate-500 text-xs">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-600 text-xs">© 2025 ENSPY · Projet PARALLAX</p>
        </div>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 py-12">
        <div className="w-full max-w-sm">
          {/* Back link */}
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-6 transition-colors"
          >
            <ChevronLeft size={14} />
            Retour à la connexion
          </Link>

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-6">
            <img src="/logo_enspy.jpg" alt="ENSPY" className="w-9 h-9 rounded-lg object-cover" />
            <p className="font-black text-lg tracking-wider">PARALLAX</p>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-900">Créer un compte</h2>
            <p className="text-slate-500 text-sm mt-1">Accès au portail PARALLAX — ENSPY</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={14} className="text-slate-400" />
                </div>
                <input
                  {...register('username', {
                    required: 'Champ requis',
                    minLength: { value: 3, message: 'Min 3 caractères' },
                    maxLength: { value: 32, message: 'Max 32 caractères' },
                  })}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                  placeholder="identifiant_unique"
                  autoFocus
                />
              </div>
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={14} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Champ requis',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email invalide' },
                  })}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                  placeholder="vous@enspy.cm"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={14} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  {...register('password', {
                    required: 'Champ requis',
                    minLength: { value: 6, message: 'Min 6 caractères' },
                  })}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Rôle
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield size={14} className="text-slate-400" />
                </div>
                <select
                  {...register('role', { required: 'Champ requis' })}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-slate-50 focus:bg-white appearance-none"
                >
                  <option value="etudiant">Étudiant</option>
                  <option value="chercheur">Chercheur</option>
                  <option value="gestionnaire">Gestionnaire</option>
                </select>
              </div>
            </div>

            {apiError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-lg">
                <span className="text-red-500 mt-0.5">⚠</span>
                <span>{apiError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-semibold text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Création…
                </>
              ) : (
                <>
                  Créer le compte
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
