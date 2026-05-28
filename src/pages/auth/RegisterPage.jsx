import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { apiClient } from 'src/api/client';

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
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md border border-black rounded-lg p-8 shadow-sm">
        <h1 className="text-2xl font-bold mb-1">Créer un compte</h1>
        <p className="text-gray-500 text-sm mb-6">PARALLAX — ENSPY</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom d&apos;utilisateur</label>
            <input
              {...register('username', { required: 'Champ requis', minLength: { value: 3, message: 'Min 3 caractères' }, maxLength: { value: 32, message: 'Max 32 caractères' } })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
            />
            {errors.username && <p className="text-[#dc2626] text-xs mt-1">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Champ requis', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email invalide' } })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
            />
            {errors.email && <p className="text-[#dc2626] text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mot de passe</label>
            <input
              type="password"
              {...register('password', { required: 'Champ requis', minLength: { value: 6, message: 'Min 6 caractères' } })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
            />
            {errors.password && <p className="text-[#dc2626] text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rôle</label>
            <select
              {...register('role', { required: 'Champ requis' })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black bg-white"
            >
              <option value="chercheur">Chercheur</option>
              <option value="gestionnaire">Gestionnaire</option>
            </select>
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
            {isSubmitting ? 'Création…' : 'Créer le compte'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-black underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
