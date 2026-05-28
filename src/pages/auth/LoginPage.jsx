import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from 'src/context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    setApiError('');
    try {
      const user = await login(data);
      navigate(user.role === 'gestionnaire' ? '/cluster' : '/dashboard', { replace: true });
    } catch (err) {
      const status = err.response?.status;
      if (status === 400 || status === 401) {
        setApiError('Identifiants incorrects. Vérifiez votre nom d\'utilisateur et mot de passe.');
      } else {
        setApiError('Erreur serveur. Veuillez réessayer.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md border border-black rounded-lg p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-1">PARALLAX</h1>
        <p className="text-gray-500 text-sm mb-6">Système de calcul distribué — ENSPY</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom d&apos;utilisateur</label>
            <input
              {...register('username', { required: 'Champ requis', minLength: { value: 2, message: 'Min 2 caractères' } })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
              placeholder="username"
              autoComplete="username"
            />
            {errors.username && <p className="text-[#dc2626] text-xs mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <input
              type="password"
              {...register('password', { required: 'Champ requis', minLength: { value: 4, message: 'Min 4 caractères' } })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {errors.password && <p className="text-[#dc2626] text-xs mt-1">{errors.password.message}</p>}
          </div>

          {apiError && (
            <div className="bg-red-50 border border-[#dc2626] text-[#dc2626] text-sm px-3 py-2 rounded">
              {apiError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-black text-white py-2 rounded font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Pas de compte ?{' '}
          <Link to="/register" className="text-black underline">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}
