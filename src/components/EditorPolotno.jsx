import { useState, useRef, useEffect } from 'react';
import { X, Maximize2, Minimize2, Send, ExternalLink, Info } from 'lucide-react';

/**
 * EditorPolotno — integra o Polotno Studio via iframe.
 *
 * O Polotno Studio (studio.polotno.com) é o editor completo hospedado
 * pelo próprio Polotno, acessível publicamente. Usamos postMessage para
 * comunicação entre o iframe e o dashboard.
 *
 * Props:
 *  corPrimaria    — cor do tema atual
 *  corSecundaria  — cor secundária do tema
 *  onPublicar     — callback(titulo, htmlConteudo, tags)
 *  onFechar       — fecha o editor
 */
export default function EditorPolotno({ corPrimaria, corSecundaria, onPublicar, onFechar }) {
  const [telaCheia, setTelaCheia] = useState(false);
  const [tituloPublicacao, setTituloPublicacao] = useState('');
  const [tagsPublicacao, setTagsPublicacao] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [publicando, setPublicando] = useState(false);
  const [imagemDesign, setImagemDesign] = useState(null); // File do design baixado
  const [previewImagem, setPreviewImagem] = useState('');
  const iframeRef = useRef(null);
  const fileInputRef = useRef(null);

  // Detectar quando o iframe carregou
  const handleIframeLoad = () => {
    setCarregando(false);
  };

  const handlePublicar = async () => {
    if (!tituloPublicacao.trim()) {
      alert('Preencha o título da publicação.');
      return;
    }

    if (!previewImagem || !imagemDesign) {
      alert('⚠️ Você precisa fazer upload da imagem do design antes de publicar!\n\n1. Clique em "Baixar" no Polotno (botão azul no canto superior direito)\n2. Depois clique no botão amarelo aqui em cima para upload\n3. Selecione a imagem que acabou de baixar\n4. Aí clique em "Publicar"');
      return;
    }

    setPublicando(true);

    try {
      const htmlConteudo = `<div style="text-align:center;margin:16px 0;"><p style="font-size:14px;color:#475569;">📐 Design criado no Editor Visual</p></div>`;
      // Passa o arquivo da imagem como 4º parâmetro
      onPublicar(tituloPublicacao, htmlConteudo, tagsPublicacao, imagemDesign);
    } finally {
      setPublicando(false);
    }
  };

  const handleUploadDesign = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagemDesign(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewImagem(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={`flex flex-col overflow-hidden shadow-2xl border border-slate-200 transition-all duration-300 ${
        telaCheia ? 'fixed inset-0 z-[250] rounded-none' : 'rounded-3xl'
      }`}
      style={{ height: telaCheia ? '100vh' : '88vh', minHeight: '600px' }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-5 py-3 shrink-0"
        style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})` }}
      >
        <div className="flex items-center gap-3 text-white">
          <span className="text-xl">🎨</span>
          <div>
            <h2 className="font-extrabold text-base leading-tight">Editor Visual de Informativos</h2>
            <p className="text-xs text-white/70">Polotno Studio — drag & drop completo</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://studio.polotno.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all"
            title="Abrir em nova aba"
          >
            <ExternalLink size={16} />
          </a>
          <button
            onClick={() => setTelaCheia(t => !t)}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all"
            title={telaCheia ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            {telaCheia ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={onFechar}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all"
            title="Fechar editor"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Barra de publicação ── */}
      <div className="flex flex-col gap-3 px-5 py-3 bg-white border-b border-slate-100 shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={tituloPublicacao}
              onChange={e => setTituloPublicacao(e.target.value)}
              placeholder="Título da publicação (obrigatório)"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:border-transparent transition-all"
            />
          </div>
          <div className="w-full sm:w-48">
            <input
              type="text"
              value={tagsPublicacao}
              onChange={e => setTagsPublicacao(e.target.value)}
              placeholder="Tags (ex: rh, processos)"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:ring-2 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Upload obrigatório + Botão publicar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Botão de upload grande e visível */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98]"
            style={{
              background: previewImagem ? '#dcfce7' : '#fef3c7',
              border: previewImagem ? '2px solid #22c55e' : '2px dashed #f59e0b',
              color: previewImagem ? '#16a34a' : '#92400e',
            }}
          >
            {previewImagem ? (
              <>✅ Imagem do design carregada — pronto para publicar</>
            ) : (
              <>⬆️ PASSO 1: Baixe no Polotno → Depois clique aqui para upload</>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUploadDesign}
          />
          {previewImagem && (
            <button
              onClick={() => { setImagemDesign(null); setPreviewImagem(''); }}
              className="p-2 text-red-400 hover:text-red-600 bg-red-50 rounded-xl transition-colors shrink-0"
              title="Remover imagem"
            >
              <X size={16} />
            </button>
          )}

          {/* Botão publicar */}
          <button
            onClick={handlePublicar}
            disabled={publicando || carregando || !previewImagem}
            className="flex items-center gap-2 px-5 py-3 text-white text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
            style={{ background: previewImagem ? `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})` : '#94a3b8' }}
          >
            {publicando
              ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send size={15} />
            }
            {publicando ? 'Publicando...' : 'Publicar'}
          </button>
        </div>

        {/* Preview da imagem */}
        {previewImagem && (
          <div className="flex items-center gap-3">
            <img src={previewImagem} alt="Preview" className="h-16 rounded-lg border border-slate-200 shadow-sm" />
            <p className="text-xs text-green-600 font-bold">✓ Imagem pronta para publicação</p>
          </div>
        )}
      </div>

      {/* ── Área do editor (iframe) ── */}
      <div className="flex-1 relative overflow-hidden bg-slate-100">
        {carregando && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
            <div
              className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mb-4"
              style={{ borderColor: `${corPrimaria}40`, borderTopColor: corPrimaria }}
            />
            <p className="text-slate-600 font-bold text-sm">Carregando editor visual...</p>
            <p className="text-slate-400 text-xs mt-1">Polotno Studio está sendo inicializado</p>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src="https://studio.polotno.com"
          onLoad={handleIframeLoad}
          className="w-full h-full border-0"
          title="Editor Visual Polotno"
          allow="clipboard-read; clipboard-write"
          style={{ opacity: carregando ? 0 : 1, transition: 'opacity 0.4s' }}
        />
      </div>

      {/* ── Rodapé ── */}
      {!carregando && (
        <div className="px-5 py-2 bg-white border-t border-slate-100 shrink-0 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            💡 Dica: use <strong>Ctrl+Z</strong> para desfazer e <strong>Ctrl+S</strong> para salvar localmente
          </p>
          <a
            href="https://studio.polotno.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold flex items-center gap-1 hover:underline"
            style={{ color: corPrimaria }}
          >
            <ExternalLink size={11} /> Abrir em tela cheia
          </a>
        </div>
      )}
    </div>
  );
}
