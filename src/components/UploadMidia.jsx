import { useState, useRef } from 'react';
import { Film, Image, PlayCircle, X, Plus, Upload, FileVideo } from 'lucide-react';

function extrairYoutubeId(url) {
  const regexes = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
  ];
  for (const r of regexes) {
    const m = url.match(r);
    if (m) return m[1];
  }
  return null;
}

function formatarTamanho(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function IconeMidia({ tipo, nomeArquivo }) {
  if (tipo === 'youtube') return <PlayCircle size={16} className="text-red-500 shrink-0" />;
  if (!nomeArquivo) return <Upload size={16} className="text-slate-400 shrink-0" />;
  const ext = nomeArquivo.split('.').pop().toLowerCase();
  if (['mp4', 'avi', 'mov', 'mkv', 'wmv'].includes(ext)) return <FileVideo size={16} className="text-blue-500 shrink-0" />;
  if (ext === 'gif') return <Film size={16} className="text-purple-500 shrink-0" />;
  if (ext === 'pdf') return <FileVideo size={16} className="text-red-400 shrink-0" />;
  return <Image size={16} className="text-emerald-500 shrink-0" />;
}

function PreviewMidia({ midia, compact }) {
  if (midia.tipo === 'youtube') {
    if (compact) return null;
    return (
      <div className="w-full aspect-video rounded-xl overflow-hidden bg-black mt-2">
        <iframe
          src={`https://www.youtube.com/embed/${midia.youtubeId}`}
          className="w-full h-full border-0"
          allowFullScreen
          title="YouTube preview"
        />
      </div>
    );
  }

  if (!midia.arquivo) return null;
  const ext = midia.arquivo.name.split('.').pop().toLowerCase();
  const url = URL.createObjectURL(midia.arquivo);

  if (['mp4', 'avi', 'mov', 'mkv', 'wmv'].includes(ext)) {
    if (compact) return null;
    return (
      <div className="mt-2 rounded-xl overflow-hidden bg-black">
        <video controls className="w-full max-h-48 object-contain" src={url} />
      </div>
    );
  }

  if (['gif', 'jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext)) {
    if (compact) return null;
    return (
      <div className="mt-2 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
        <img src={url} alt={midia.arquivo.name} className="max-h-48 max-w-full object-contain rounded-xl" />
      </div>
    );
  }

  return null;
}

export default function UploadMidia({ midias = [], onChange, corPrimaria = '#00A859', compact = false }) {
  const [mostrarCampoYoutube, setMostrarCampoYoutube] = useState(false);
  const [urlYoutube, setUrlYoutube] = useState('');
  const [erroYoutube, setErroYoutube] = useState('');
  const fileInputRef = useRef(null);

  const tiposAceitos = [
    'video/mp4', 'video/avi', 'video/quicktime', 'video/x-matroska', 'video/x-ms-wmv',
    'image/gif', 'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml',
    'application/pdf'
  ].join(',');

  const handleArquivos = (e) => {
    const novosArquivos = Array.from(e.target.files || []);
    if (!novosArquivos.length) return;

    const novasMidias = novosArquivos.map(arquivo => ({
      tipo: 'arquivo',
      arquivo,
      id: `${arquivo.name}-${arquivo.size}-${Date.now()}-${Math.random()}`
    }));

    onChange([...midias, ...novasMidias]);
    e.target.value = '';
  };

  const handleAdicionarYoutube = () => {
    setErroYoutube('');
    const id = extrairYoutubeId(urlYoutube.trim());
    if (!id) {
      setErroYoutube('URL inválida. Use youtube.com/watch?v=ID ou youtu.be/ID');
      return;
    }
    const nova = {
      tipo: 'youtube',
      youtubeUrl: urlYoutube.trim(),
      youtubeId: id,
      id: `yt-${id}-${Date.now()}`
    };
    onChange([...midias, nova]);
    setUrlYoutube('');
    setMostrarCampoYoutube(false);
  };

  const handleRemover = (idMidia) => {
    onChange(midias.filter(m => m.id !== idMidia));
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
        <Upload size={12} /> Mídias (vídeos, GIFs, imagens, YouTube)
      </label>

      {/* Botões de ação */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 active:scale-95"
        >
          <Upload size={14} /> Selecionar arquivos
        </button>
        <button
          type="button"
          onClick={() => { setMostrarCampoYoutube(v => !v); setErroYoutube(''); }}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all border active:scale-95"
          style={{
            background: mostrarCampoYoutube ? corPrimaria + '15' : '#f1f5f9',
            borderColor: mostrarCampoYoutube ? corPrimaria + '60' : '#e2e8f0',
            color: mostrarCampoYoutube ? corPrimaria : '#475569'
          }}
        >
          <PlayCircle size={14} /> Link YouTube
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={tiposAceitos}
          onChange={handleArquivos}
          className="hidden"
        />
      </div>

      {/* Campo YouTube */}
      {mostrarCampoYoutube && (
        <div className="flex flex-col sm:flex-row gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex-1 space-y-1">
            <input
              type="url"
              value={urlYoutube}
              onChange={e => { setUrlYoutube(e.target.value); setErroYoutube(''); }}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdicionarYoutube())}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:border-transparent outline-none transition-all"
              style={{ '--tw-ring-color': corPrimaria }}
            />
            {erroYoutube && (
              <p className="text-xs text-red-500 ml-1">{erroYoutube}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleAdicionarYoutube}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 shrink-0"
            style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corPrimaria}cc)` }}
          >
            <Plus size={14} /> Adicionar
          </button>
        </div>
      )}

      {/* Lista de mídias */}
      {midias.length > 0 && (
        <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {midias.map(midia => (
            <div
              key={midia.id}
              className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1 animate-in fade-in zoom-in-95 duration-200"
            >
              {/* Cabeçalho do item */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <IconeMidia tipo={midia.tipo} nomeArquivo={midia.arquivo?.name} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">
                      {midia.tipo === 'youtube'
                        ? `YouTube: ${midia.youtubeId}`
                        : midia.arquivo?.name}
                    </p>
                    {midia.tipo === 'arquivo' && midia.arquivo && (
                      <p className="text-[10px] text-slate-400">{formatarTamanho(midia.arquivo.size)}</p>
                    )}
                    {midia.tipo === 'youtube' && (
                      <p className="text-[10px] text-slate-400 truncate">{midia.youtubeUrl}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemover(midia.id)}
                  className="shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Remover"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Preview */}
              <PreviewMidia midia={midia} compact={compact} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
