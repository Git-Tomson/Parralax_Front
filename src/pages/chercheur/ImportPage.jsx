import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useImportProgramme, useSubmitProgramme } from 'src/hooks/useTasks';
import { useAuth } from 'src/context/AuthContext';
import { useToast } from 'src/components/ui/Toast';
import { Card, CardHeader, CardBody } from 'src/components/ui/Card';
import {
  Upload, FileCode, CheckCircle2, Play, Eye, HardDrive,
  ChevronLeft, AlertCircle, ArrowRight,
} from 'lucide-react';

const QUOTA_BYTES = 1_073_741_824;

const ACCEPTED_EXTENSIONS =
  '.py,.c,.cpp,.h,.hpp,.java,.sh,.f90,.f,.r,.R,.zip,.tar,.gz,.tgz';

function formatBytes(b) {
  if (b == null) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} Ko`;
  return `${(b / 1048576).toFixed(1)} Mo`;
}

function guessBaseName(filename) {
  return filename.replace(/\.(py|c|cpp|h|hpp|java|sh|f90|f|r|zip|tar\.gz|tgz|gz)$/i, '');
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
    formState: { errors },
  } = useForm();

  const selectedFile = watch('file')?.[0];
  const used = user?.storage_used_bytes ?? 0;
  const usedPct = Math.min(100, (used / QUOTA_BYTES) * 100);

  const onFileChange = (files) => {
    if (!files?.length) return;
    setValue('file', files, { shouldValidate: true });
    setValue('name', guessBaseName(files[0].name));
  };

  const onSubmit = async (data) => {
    const fd = new FormData();
    fd.append('file', data.file[0]);
    fd.append('name', data.name.trim());
    if (data.description?.trim()) fd.append('description', data.description.trim());

    try {
      const res = await importMutation.mutateAsync(fd);
      const id = res.data?.data?.id;
      setCreatedId(id);
      addToast('Programme importé avec succès.', 'success');
    } catch (err) {
      const status = err.response?.status;
      if (status === 413) {
        addToast('Quota disque dépassé. Supprimez des programmes existants.', 'error');
      } else if (status === 422) {
        addToast(
          err.response?.data?.error ?? 'Format de fichier non autorisé ou archive invalide.',
          'error'
        );
      } else {
        addToast("Erreur lors de l'import.", 'error');
      }
    }
  };

  const handleSubmitExec = async () => {
    try {
      await submitMutation.mutateAsync(createdId);
      addToast("Programme soumis à l'exécution.", 'success');
      navigate(`/programmes/${createdId}`);
    } catch {
      addToast('Erreur lors de la soumission.', 'error');
    }
  };

  // Success state
  if (createdId) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-8 text-center border-b border-emerald-100">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Programme importé !</h2>
            <p className="text-slate-500 text-sm">
              Le fichier a été importé avec succès dans le système PARALLAX.
            </p>
          </div>
          <div className="p-6">
            <p className="text-slate-600 text-sm text-center mb-6">
              Voulez-vous soumettre ce programme pour exécution sur le cluster ?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSubmitExec}
                disabled={submitMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-600/20"
              >
                {submitMutation.isPending ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Soumission…
                  </>
                ) : (
                  <>
                    <Play size={15} />
                    Soumettre pour exécution
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
              <button
                onClick={() => navigate(`/programmes/${createdId}`)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors"
              >
                <Eye size={14} />
                Voir le projet d'abord
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Back link */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm transition-colors"
      >
        <ChevronLeft size={15} />
        Retour à mes projets
      </button>

      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Importer un programme</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Importez un fichier source ou une archive pour l'exécuter sur le cluster PARALLAX
        </p>
      </div>

      {/* Storage quota */}
      <Card>
        <CardBody className="py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
              <HardDrive size={15} className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-600">Stockage utilisé</span>
                <span className="text-xs font-semibold text-slate-700">
                  {formatBytes(used)} <span className="text-slate-400 font-normal">/ 1 Go</span>
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    usedPct > 85 ? 'bg-red-500' : usedPct > 65 ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
            </div>
            {usedPct > 85 && (
              <AlertCircle size={16} className="text-red-500 shrink-0" />
            )}
          </div>
        </CardBody>
      </Card>

      {/* Upload form */}
      <Card>
        <CardHeader title="Nouveau projet" subtitle="Remplissez les informations du programme" />
        <CardBody>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Drop zone */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Fichier source <span className="text-red-500">*</span>
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  onFileChange(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50 scale-[1.01]'
                    : selectedFile
                    ? 'border-emerald-400 bg-emerald-50'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/30'
                }`}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <FileCode size={20} className="text-emerald-600" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400">{formatBytes(selectedFile.size)}</p>
                    <span className="text-xs text-emerald-600 font-medium">✓ Fichier sélectionné</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <Upload size={20} className="text-slate-400" />
                    </div>
                    <p className="text-slate-600 text-sm font-medium">
                      Glissez votre fichier ici
                    </p>
                    <p className="text-slate-400 text-xs">ou cliquez pour parcourir</p>
                    <p className="text-slate-300 text-xs mt-1">
                      .py .c .cpp .java .sh .f90 .r · .zip .tar.gz .tgz
                    </p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => onFileChange(e.target.files)}
                {...register('file', { required: 'Sélectionnez un fichier source ou une archive.' })}
              />
              {errors.file && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={11} />
                  {errors.file.message}
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nom du projet <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name', {
                  required: 'Champ requis',
                  minLength: { value: 2, message: 'Min 2 caractères' },
                  maxLength: { value: 128, message: 'Max 128 caractères' },
                })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all"
                placeholder="Mon programme de calcul"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Description <span className="text-slate-400 font-normal">(optionnel)</span>
              </label>
              <textarea
                {...register('description', {
                  maxLength: { value: 512, message: 'Max 512 caractères' },
                })}
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all resize-none"
                placeholder="Décrivez votre programme, son objectif, les paramètres d'entrée…"
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={importMutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {importMutation.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Import en cours…
                </>
              ) : (
                <>
                  <Upload size={15} />
                  Importer le programme
                </>
              )}
            </button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
