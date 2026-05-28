import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useImportProgramme, useSubmitProgramme } from 'src/hooks/useTasks';
import { useAuth } from 'src/context/AuthContext';
import { useToast } from 'src/components/ui/Toast';

const QUOTA_BYTES = 1_073_741_824; // 1 Go

function formatBytes(b) {
  if (b == null) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

export default function ImportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [createdId, setCreatedId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef();

  const importMutation = useImportProgramme();
  const submitMutation = useSubmitProgramme();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const selectedFile = watch('file')?.[0];

  const onFileChange = (files) => {
    if (!files?.length) return;
    setValue('file', files, { shouldValidate: true });
    const name = files[0].name.replace(/\.c$/i, '');
    setValue('name', name);
  };

  const onSubmit = async (data) => {
    const fd = new FormData();
    fd.append('file', data.file[0]);
    fd.append('name', data.name.trim());
    if (data.description?.trim()) fd.append('description', data.description.trim());

    try {
      const res = await importMutation.mutateAsync(fd);
      const id = res.data?.id ?? res.data?.task_id;
      setCreatedId(id);
      addToast('Programme importé avec succès.', 'success');
    } catch (err) {
      const status = err.response?.status;
      if (status === 413) addToast('Quota disque dépassé. Supprimez des programmes existants.', 'error');
      else if (status === 422) addToast('Format de fichier invalide. Seuls les fichiers .c sont acceptés.', 'error');
      else addToast('Erreur lors de l\'import.', 'error');
    }
  };

  const handleSubmitExec = async () => {
    try {
      await submitMutation.mutateAsync(createdId);
      addToast('Programme soumis à l\'exécution.', 'success');
      navigate(`/programmes/${createdId}`);
    } catch {
      addToast('Erreur lors de la soumission.', 'error');
    }
  };

  const used = user?.storage_used_bytes ?? 0;
  const usedPct = Math.min(100, (used / QUOTA_BYTES) * 100);

  if (createdId) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-[#16a34a] text-4xl mb-3">✓</div>
          <h2 className="text-xl font-semibold mb-2">Programme importé</h2>
          <p className="text-gray-500 text-sm mb-6">
            Le fichier a été importé. Voulez-vous le soumettre pour exécution immédiatement ?
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleSubmitExec}
              disabled={submitMutation.isPending}
              className="px-5 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {submitMutation.isPending ? 'Soumission…' : 'Soumettre pour exécution'}
            </button>
            <button
              onClick={() => navigate(`/programmes/${createdId}`)}
              className="px-5 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Voir mon projet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-6">Importer un programme C</h2>

      <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Stockage utilisé</span>
          <span className="font-medium">{formatBytes(used)} / 1 Go</span>
        </div>
        <div className="w-full bg-gray-200 rounded h-2">
          <div
            className={`h-full rounded ${usedPct > 85 ? 'bg-[#dc2626]' : usedPct > 65 ? 'bg-[#ea580c]' : 'bg-black'}`}
            style={{ width: `${usedPct}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">Fichier source (.c) *</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); onFileChange(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragging ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {selectedFile ? (
              <p className="text-sm font-medium">{selectedFile.name}</p>
            ) : (
              <>
                <p className="text-gray-500 text-sm">Glissez votre fichier ici ou cliquez pour parcourir</p>
                <p className="text-gray-400 text-xs mt-1">Fichiers .c uniquement</p>
              </>
            )}
          </div>
          <input
            type="file"
            accept=".c"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => onFileChange(e.target.files)}
            {...register('file', { required: 'Sélectionnez un fichier .c' })}
          />
          {errors.file && <p className="text-[#dc2626] text-xs mt-1">{errors.file.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Nom du projet *</label>
          <input
            {...register('name', {
              required: 'Champ requis',
              minLength: { value: 2, message: 'Min 2 caractères' },
              maxLength: { value: 128, message: 'Max 128 caractères' },
            })}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black"
          />
          {errors.name && <p className="text-[#dc2626] text-xs mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description (optionnel)</label>
          <textarea
            {...register('description', { maxLength: { value: 512, message: 'Max 512 caractères' } })}
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-black resize-none"
          />
          {errors.description && <p className="text-[#dc2626] text-xs mt-1">{errors.description.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || importMutation.isPending}
          className="w-full bg-black text-white py-2 rounded font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {importMutation.isPending ? 'Import en cours…' : 'Importer'}
        </button>
      </form>
    </div>
  );
}
