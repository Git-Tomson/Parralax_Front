import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { apiClient, extractErrorMessage } from 'src/api/client';
import { useNetworkStatus } from 'src/hooks/useNetworkStatus';
import { User, Mail, Lock, Shield, ArrowRight, ChevronLeft, Eye, EyeOff, Check, X } from 'lucide-react';

function PasswordStrength({ password }) {
  if (!password) return null;
  const checks = [
    { ok: password.length >= 8,           label: '8 caractères min' },
    { ok: /[A-Z]/.test(password),         label: 'Majuscule' },
    { ok: /[0-9]/.test(password),         label: 'Chiffre' },
    { ok: /[^a-zA-Z0-9]/.test(password),  label: 'Caractère spécial' },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ['bg-red-500', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500'];
  const labels = ['', 'Très faible', 'Faible', 'Moyen', 'Fort'];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score] : 'bg-slate-200'}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${score <= 1 ? 'text-red-500' : score <= 2 ? 'text-amber-500' : 'text-emerald-600'}`}>
          {labels[score] || ''}
        </span>
        <div className="flex gap-2">
          {checks.map((c) => (
            <span key={c.label} className={`text-[10px] flex items-center gap-0.5 ${c.ok ? 'text-emerald-600' : 'text-slate-400'}`}>
              {c.ok ? <Check size={9} /> : <X size={9} />}
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { isOnline } = useNetworkStatus();
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { role: 'etudiant' } });

  const passwordValue = watch('password') ?? '';

  const onSubmit = async (data) => {
    if (!isOnline) {
      setApiError('Aucune connexion réseau.');
      return;
    }
    setApiError('');
    try {
      await apiClient.post('/api/auth/register', {
        username: data.username.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        role: data.role,
      });
      navigate('/login');
    } catch (err) {
      setApiError(extractErrorMessage(err));
    }
  };

  const inputCls = (field) =>
    `w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm transition-all bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 ${
      errors[field]
        ? 'border-red-300 focus:ring-red-300'
        : 'border-slate-200 focus:ring-blue-500 focus:border-transparent'
    }`;

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[40%] flex-col bg-slate-900 circuit-bg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-slate-900/50 to-slate-900 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(#a78bfa 1px, transparent 1px), linear-gradient(90deg, #a78bfa 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full p-10">
          <div className="flex items-center gap-3">
            <img src="/logo_enspy.jpg" alt="ENSPY" className="w-11 h-11 rounded-xl object-cover ring-2 ring-violet-400/40" />
            <div>
              <p className="text-white font-black text-lg tracking-widest">PARALLAX</p>
              <p className="text-violet-400/70 text-[10px] tracking-widest uppercase">ENSPY · HPC Portal</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              Rejoignez<br />le cluster
            </h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Créez votre compte pour accéder à la plateforme de calcul distribué haute performance de l'ENSPY.
            </p>

            <div className="space-y-3">
              {[
                { icon: '🎓', label: 'Étudiant', desc: 'Exécutez vos TP et projets sur le cluster HPC' },
                { icon: '🔬', label: 'Chercheur', desc: 'Soumettez et supervisez vos programmes de calcul' },
                { icon: '⚙️', label: 'Gestionnaire', desc: 'Administrez le cluster et ses ressources matérielles' },
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

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 py-10">
        <div className="w-full max-w-sm">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm mb-6 transition-colors">
            <ChevronLeft size={14} />
            Retour à la connexion
          </Link>

          <div className="flex lg:hidden items-center gap-3 mb-6">
            <img src="/logo_enspy.jpg" alt="ENSPY" className="w-9 h-9 rounded-lg object-cover" />
            <p className="font-black text-lg tracking-wider">PARALLAX</p>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Créer un compte</h2>
            <p className="text-slate-500 text-sm mt-1">Accès au portail PARALLAX — ENSPY</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {/* Username */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nom d'utilisateur</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={14} className={errors.username ? 'text-red-400' : 'text-slate-400'} />
                </div>
                <input
                  {...register('username', {
                    required: 'Champ requis.',
                    minLength: { value: 3, message: 'Minimum 3 caractères.' },
                    maxLength: { value: 32, message: 'Maximum 32 caractères.' },
                    pattern: { value: /^[a-zA-Z0-9_.-]+$/, message: 'Uniquement lettres, chiffres, _ . -' },
                  })}
                  className={inputCls('username')}
                  placeholder="identifiant_unique"
                  autoFocus
                />
              </div>
              {errors.username && <p className="text-red-500 text-xs mt-1">⚠ {errors.username.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Adresse email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={14} className={errors.email ? 'text-red-400' : 'text-slate-400'} />
                </div>
                <input
                  type="email"
                  {...register('email', {
                    required: 'Email requis.',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Format email invalide.' },
                  })}
                  className={inputCls('email')}
                  placeholder="vous@enspy.cm"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">⚠ {errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={14} className={errors.password ? 'text-red-400' : 'text-slate-400'} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Mot de passe requis.',
                    minLength: { value: 8, message: 'Minimum 8 caractères.' },
                  })}
                  className={`${inputCls('password')} pr-10`}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600" tabIndex={-1}>
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">⚠ {errors.password.message}</p>}
              <PasswordStrength password={passwordValue} />
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirmer le mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={14} className={errors.confirm ? 'text-red-400' : 'text-slate-400'} />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  {...register('confirm', {
                    required: 'Confirmez votre mot de passe.',
                    validate: (v) => v === passwordValue || 'Les mots de passe ne correspondent pas.',
                  })}
                  className={`${inputCls('confirm')} pr-10`}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600" tabIndex={-1}>
                  {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              {errors.confirm && <p className="text-red-500 text-xs mt-1">⚠ {errors.confirm.message}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rôle</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield size={14} className="text-slate-400" />
                </div>
                <select
                  {...register('role', { required: 'Champ requis.' })}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white appearance-none"
                >
                  <option value="etudiant">🎓 Étudiant</option>
                  <option value="chercheur">🔬 Chercheur</option>
                  <option value="gestionnaire">⚙️ Gestionnaire</option>
                </select>
              </div>
            </div>

            {apiError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2.5 rounded-lg">
                <span className="text-red-500 mt-0.5 shrink-0">⚠</span>
                <span>{apiError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !isOnline}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-semibold text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {isSubmitting
                ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Création…</>
                : <>Créer le compte<ArrowRight size={15} /></>
              }
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:underline">Se connecter</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
