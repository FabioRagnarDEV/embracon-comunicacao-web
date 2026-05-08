import { useState, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * ModalVideo — insere vídeo diretamente no conteúdo do comunicado/script.
 *
 * ABORDAGEM: Em vez de manipular o Quill via ref (que falha com react-quill-new + React 19),
 * chamamos um callback `onInserir(html)` que o componente pai usa para concatenar ao conteúdo.
 *
 * Props:
 *  onInserir  — callback(htmlString) — insere o HTML no conteúdo
 *  aberto     — boolean
 *  onFechar   — callback para fechar
 *  corPrimaria — cor do tema
 */

function extrairYoutubeEmbed(input) {
  const regexes = [
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtu\.be\/([^?\s]+)/,
    /youtube\.com\/shorts\/([^?\s]+)/,
    /youtube\.com\/embed\/([^?\s]+)/,
  ];
  for (const r of regexes) {
    const m = input.match(r);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  return null;
}

export default function ModalVideo({ onInserir, aberto, onFechar, corPrimaria = '#00A859' }) {
  const [aba, setAba] = useState('url');
  const [url, setUrl] = useState('');
  const [erro, setErro] = useState('');
  const fileRef = useRef(null);

  if (!aberto) return null;

  function inserirUrl() {
    setErro('');
    const input = url.trim();
    if (!input) { setErro('Cole uma URL de vídeo ou YouTube.'); return; }

    const youtubeEmbed = extrairYoutubeEmbed(input);

    let html;
    if (youtubeEmbed) {
      html = `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:12px;margin:16px 0;"><iframe src="${youtubeEmbed}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:12px;" allowfullscreen loading="lazy"></iframe></div>`;
    } else {
      // Link direto de vídeo
      html = `<div style="margin:16px 0;border-radius:12px;overflow:hidden;"><video controls style="width:100%;max-height:400px;border-radius:12px;" src="${input}"></video></div>`;
    }

    onInserir(html);
    setUrl('');
    onFechar();
  }

  function inserirArquivo(file) {
    if (!file || !file.type.startsWith('video/')) {
      setErro('Selecione um arquivo de vídeo válido (MP4, AVI, MOV, MKV, WMV).');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const html = `<div style="margin:16px 0;border-radius:12px;overflow:hidden;"><video controls style="width:100%;max-height:400px;border-radius:12px;" src="${objectUrl}"></video></div>`;
    onInserir(html);
    onFechar();
  }

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onFechar}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-base">
            🎬 Inserir Vídeo no Conteúdo
          </h3>
          <button
            onClick={onFechar}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Abas */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-4">
          {[
            { id: 'url',     label: '🔗 URL / YouTube' },
            { id: 'arquivo', label: '📁 Arquivo local' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setAba(t.id); setErro(''); }}
              className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
              style={aba === t.id
                ? { background: corPrimaria, color: '#fff' }
                : { color: '#475569' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Aba URL */}
        {aba === 'url' && (
          <div className="space-y-3">
            <input
              type="url"
              value={url}
              onChange={e => { setUrl(e.target.value); setErro(''); }}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), inserirUrl())}
              placeholder="https://youtube.com/watch?v=... ou link .mp4"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': corPrimaria }}
              autoFocus
            />
            {erro && <p className="text-xs text-red-500 ml-1">{erro}</p>}
            <p className="text-xs text-slate-400 ml-1">
              ✅ YouTube, youtu.be, /shorts/ &nbsp;|&nbsp; ✅ Links diretos .mp4, .webm, .mov
            </p>
            <button
              onClick={inserirUrl}
              className="w-full py-3 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corPrimaria}cc)` }}
            >
              Inserir no conteúdo
            </button>
          </div>
        )}

        {/* Aba Arquivo */}
        {aba === 'arquivo' && (
          <div className="space-y-3">
            <div
              className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 transition-all select-none"
              style={{ borderColor: corPrimaria + '60' }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) inserirArquivo(file);
              }}
            >
              <div className="text-4xl mb-3">🎬</div>
              <p className="text-sm font-bold text-slate-700">Clique ou arraste o vídeo aqui</p>
              <p className="text-xs text-slate-400 mt-1">MP4, AVI, MOV, MKV, WMV</p>
            </div>
            {erro && <p className="text-xs text-red-500 ml-1">{erro}</p>}
            <input
              ref={fileRef}
              type="file"
              accept="video/mp4,video/avi,video/quicktime,video/x-matroska,video/x-ms-wmv,video/*"
              className="hidden"
              onChange={e => inserirArquivo(e.target.files?.[0])}
            />
          </div>
        )}
      </div>
    </div>
  );
}
