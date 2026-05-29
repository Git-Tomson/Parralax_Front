import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useImportProgramme, useSubmitProgramme } from 'src/hooks/useTasks';
import { useAuth } from 'src/context/AuthContext';
import { useToast } from 'src/components/ui/Toast';
import { useNetworkStatus } from 'src/hooks/useNetworkStatus';
import { extractErrorMessage } from 'src/api/client';
import { Card, CardHeader, CardBody } from 'src/components/ui/Card';
import {
  Upload, FileCode, CheckCircle2, Play, Eye, HardDrive,
  ChevronLeft, AlertCircle, ArrowRight, X, WifiOff,
} from 'lucide-react';

const QUOTA_BYTES = 1_073_741_824;       // 1 Go
const MAX_UPLOAD_BYTES = 100_000_000;    // 100 Mo (limite HTTP backend)
const WARN_UPLOAD_BYTES = 90_000_000;    // 90 Mo — avertissement

const ACCEPTED_EXTENSIONS = '.py,.c,.cpp,.h,.hpp,.java,.sh,.f90,.f,.r,.R,.zip,.tar,.gz,.tgz';
const ACCEPTED_MIME = [
  'text/x-python', 'text/x-c', 'text/x-c++', 'text/x-java-source',
  'application/x-sh', 'application/zip', 'application/gzip',
  'application/x-tar', 'application/x-gzip', 'text/plain',
  'application/octet-stream',
];

function formatBytes(b) {
  if (b == null || b === 0) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1_048_576) return `${(b / 1024).toFixed(1)} Ko`;
  if (b < 1_073_741_824) return `${(b / 1_048_576).toFixed(1)} Mo`;
  return `${(b / 1_073_741_824).toFixed(2)} Go`;
}

function guessBaseName(filename) {
  return filename
    .replace(/\.(tar\.gz|tar\.bz2|tar\.xz)$/i, '')
    .replace(/\.(py|c|cpp|h|hpp|java|sh|f90|f|r|zip|tar|gz|tgz|bz2|xz)$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim();
}

function validateFileClient(file) {
  if (!file) return null;
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  const accepted = ACCEPTED_EXTENSIONS.split(',');
  const validExt = accepted.some((a) => file.name.toLowerCase().endsWith(a.replace('.', ''))) ||
    accepted.includes(ext);
  if (!validExt) return `Extension non autorisée : ${ext}. Formats acceptés : ${ACCEPTED_EXTENSIONS}`;
  if (file.size > MAX_UPLOAD_BYTES) return `Fichier trop volumineux (${formatBytes(file.size)}). Maximum : ${formatBytes(MAX_UPLOAD_BYTES)}`;
  return null;
}

export default function ImportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { isOnline } = useNetworkStatus();
  const [createdId, setCreatedId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef();

  const importMutation = useImportProgramme();
  const submitMutation = useSubmitProgramme();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const { ref: rhfRef, ...fileRegisterRest } = register('file', {
    required: 'Sélectionnez un fichier source ou une archive.',
  });

  const selectedFile = watch('file')?.[0];
  const used = user?.storage_used_bytes ?? 0;
  const usedPct = Math.min(100, (used / QUOTA_BYTES) * 100);
  const remaining = QUOTA_BYTES - used;

  const onFileChange = (files) => {
    if (!files?.length) return;
    const file = files[0];
    const err = validateFileClient(file);
    setFileError(err ?? '');
    if (err) return;
    setValue('file', files, { shouldValidate: true });
    setValue('name', guessBaseName(file.name));
    if (file.size >= WARN_UPLOAD_BYTES) {
      addToast(`Fichier volumineux (${formatBytes(file.size)}). L'upload peut prendre du temps.`, 'warning');
    }
  };

  const clearFile = () => {
    setValue('file', undefined);
    setValue('name', '');
    setFileError('');
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data) => {
    if (!isOnline) { addToast('Aucune connexion réseau.', 'error'); return; }
    if (fileError) return;
    if (selectedFile && selectedFile.size > remaining) {
      addToast(`Quota insuffisant. Il vous reste ${formatBytes(remaining)} mais le fichier fait ${formatBytes(selectedFile.size)}.`, 'error');
      return;
    }

    const fd = new FormData();
    fd.append('file', data.file[0]);
    fd.append('name', data.name.trim());
    if (data.description?.trim()) fd.append('description', data.description.trim());

    setUploadProgress(0);
    try {
      const res = await importMutation.mutateAsync(fd, {
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      const id = res.data?.data?.id;
      setCreatedId(id);
      setUploadProgress(100);
      addToast('Programme importé avec succès.', 'success');
    } catch (err) {
      setUploadProgress(0);
      addToast(extractErrorMessage(err), 'error');
    }
  };

  const handleSubmitExec = async () => {
    if (!isOnline) { addToast('Aucune connexion réseau.', 'error'); return; }
    try {
      await submitMutation.mutateAsync(createdId);
      addToast('Programme soumis à l\'exécution distribuée.', 'success');
      navigate(`/programmes/${createdId}`);
    } catch (err) {
      addToast(extractErrorMessage(err), 'error');
    }
  };

  // Success state
  if (createdId) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-8 text-center border-b border-emerald-100">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Programme importé !</h2>
            <p className="text-slate-500 text-sm">Fichier téléversé et validé par le cluster PARALLAX.</p>
          </div>
          <div className="p-6">
            <p className="text-slate-600 text-sm text-center mb-5">
              Voulez-vous soumettre ce programme pour exécution immédiate sur le cluster ?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSubmitExec}
                disabled={submitMutation.isPending || !isOnline}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-600/20"
              >
                {submitMutation.isPending
                  ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Soumission…</>
                  : <><Play size={15} />Soumettre pour exécution<ArrowRight size={15} /></>
                }
              </button>
              <button
                onClick={() => navigate(`/programmes/${createdId}`)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors"
              >
                <Eye size={14} />Voir le projet d'abord
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm transition-colors">
        <ChevronLeft size={15} />Retour à mes projets
      </button>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Importer un programme</h1>
        <p className="text-slate-500 text-sm mt-0.5">Téléversez un fichier source ou une archive pour exécution sur le cluster PARALLAX</p>
      </div>

      {/* Hors ligne */}
      {!isOnline && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-lg">
          <WifiOff size={14} className="shrink-0" />
          Hors ligne — l'import est impossible sans connexion réseau.
        </div>
      )}

      {/* Quota */}
      <Card>
        <CardBody className="py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
              <HardDrive size={15} className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-600">Quota de stockage</span>
                <span className="text-xs font-semibold text-slate-700">
                  {formatBytes(used)} <span className="text-slate-400 font-normal">/ {formatBytes(QUOTA_BYTES)}</span>
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all ${usedPct > 90 ? 'bg-red-500' : usedPct > 75 ? 'bg-amber-500' : 'bg-blue-500'}`}
                  style={{ width: `${usedPct}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Espace restant : {formatBytes(remaining)}</p>
            </div>
            {usedPct > 90 && <AlertCircle size={16} className="text-red-500 shrink-0" title="Quota presque plein" />}
          </div>
        </CardBody>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader title="Nouveau projet" subtitle="Remplissez les informations du programme à exécuter" />
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
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); onFileChange(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all select-none ${
                  isDragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' :
                  fileError ? 'border-red-400 bg-red-50' :
                  selectedFile ? 'border-emerald-400 bg-emerald-50' :
                  'border-slate-300 hover:border-blue-400 hover:bg-blue-50/30'
                }`}
              >
                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${fileError ? 'bg-red-100' : 'bg-emerald-100'}`}>
                      <FileCode size={20} className={fileError ? 'text-red-500' : 'text-emerald-600'} />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">{selectedFile.name}</p>
                    <p className="text-xs text-slate-400">{formatBytes(selectedFile.size)}</p>
                    {!fileError && <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 size={11} />Fichier valide</span>}
                    {fileError && <span className="text-xs text-red-600 font-medium">{fileError}</span>}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); clearFile(); }}
                      className="mt-1 flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={11} />Retirer le fichier
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <Upload size={20} className="text-slate-400" />
                    </div>
                    <p className="text-slate-600 text-sm font-medium">Glissez votre fichier ici</p>
                    <p className="text-slate-400 text-xs">ou cliquez pour parcourir</p>
                    <p className="text-slate-300 text-xs mt-1">.py .c .cpp .java .sh .f90 .r · .zip .tar.gz · Max {formatBytes(MAX_UPLOAD_BYTES)}</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept={ACCEPTED_EXTENSIONS}
                ref={(e) => { rhfRef(e); fileInputRef.current = e; }}
                className="hidden"
                onChange={(e) => onFileChange(e.target.files)}
                {...fileRegisterRest}
              />
              {errors.file && !selectedFile && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.file.message}</p>
              )}
            </div>

            {/* Upload progress */}
            {importMutation.isPending && uploadProgress > 0 && (
              <div>
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span>Téléversement en cours…</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nom du projet <span className="text-red-500">*</span>
              </label>
              <input
                {...register('name', {
                  required: 'Nom requis.',
                  minLength: { value: 2, message: 'Minimum 2 caractères.' },
                  maxLength: { value: 128, message: 'Maximum 128 caractères.' },
                  validate: (v) => v.trim().length >= 2 || 'Le nom ne peut pas être vide.',
                })}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all bg-slate-50 focus:bg-white ${
                  errors.name ? 'border-red-300 focus:ring-red-300' : 'border-slate-200 focus:ring-blue-500'
                }`}
                placeholder="Mon programme de calcul"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">⚠ {errors.name.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Description <span className="text-slate-400 font-normal">(optionnel)</span>
              </label>
              <textarea
                {...register('description', { maxLength: { value: 512, message: 'Maximum 512 caractères.' } })}
                rows={3}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 focus:bg-white transition-all resize-none"
                placeholder="Objectif du calcul, paramètres d'entrée, résultats attendus…"
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">⚠ {errors.description.message}</p>}
            </div>

            <button
              type="submit"
              disabled={importMutation.isPending || !!fileError || !isOnline}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importMutation.isPending
                ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Import en cours ({uploadProgress}%)…</>
                : <><Upload size={15} />Importer le programme</>
              }
            </button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
