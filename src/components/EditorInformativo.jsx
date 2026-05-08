import { useState, useCallback } from 'react';
import {
  Plus, Trash2, ChevronUp, ChevronDown, Copy, Send, X,
  AlignLeft, AlignCenter, AlignRight, Type, Layout,
  AlertTriangle, Info, Bookmark, Trophy, FileText
} from 'lucide-react';

// ─── Templates pré-definidos ────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'alerta',
    label: 'Alerta Urgente',
    icon: <AlertTriangle size={14} />,
    emoji: '⚠️',
    corFundo: '#dc2626',
    corTexto: '#ffffff',
  },
  {
    id: 'novidade',
    label: 'Novidade',
    icon: <span className="text-xs">🆕</span>,
    emoji: '🆕',
    corFundo: '#16a34a',
    corTexto: '#ffffff',
  },
  {
    id: 'informativo',
    label: 'Informativo',
    icon: <Info size={14} />,
    emoji: 'ℹ️',
    corFundo: '#2563eb',
    corTexto: '#ffffff',
  },
  {
    id: 'lembrete',
    label: 'Lembrete',
    icon: <Bookmark size={14} />,
    emoji: '📌',
    corFundo: '#fbbf24',
    corTexto: '#1e293b',
  },
  {
    id: 'conquista',
    label: 'Conquista',
    icon: <Trophy size={14} />,
    emoji: '🏆',
    corFundo: '#7c3aed',
    corTexto: '#ffffff',
  },
  {
    id: 'padrao',
    label: 'Padrão',
    icon: <FileText size={14} />,
    emoji: '',
    corFundo: '#ffffff',
    corTexto: '#1e293b',
  },
];

// ─── Mapeamento de tamanho de título ────────────────────────────────────────
const TAMANHO_MAP = {
  pequeno: { label: 'P', fontSize: '1rem' },
  medio: { label: 'M', fontSize: '1.375rem' },
  grande: { label: 'G', fontSize: '1.875rem' },
};

// ─── Bloco inicial padrão ───────────────────────────────────────────────────
const criarBloco = (id) => ({
  id,
  tituloBLoco: '',
  conteudo: '',
  corFundo: '#ffffff',
  corTexto: '#1e293b',
  alinhamento: 'left',
  tamanhoTitulo: 'medio',
  emoji: '',
});

let proximoId = 2;

// ─── Componente principal ───────────────────────────────────────────────────
export default function EditorInformativo({ corPrimaria, corSecundaria, onPublicar, onFechar }) {
  const [tituloInformativo, setTituloInformativo] = useState('');
  const [tagsInformativo, setTagsInformativo] = useState('');
  const [blocos, setBlocos] = useState([criarBloco(1)]);

  // ── Helpers de bloco ──────────────────────────────────────────────────────
  const atualizarBloco = useCallback((id, campo, valor) => {
    setBlocos((prev) =>
      prev.map((b) => (b.id === id ? { ...b, [campo]: valor } : b))
    );
  }, []);

  const adicionarBloco = useCallback(() => {
    setBlocos((prev) => [...prev, criarBloco(proximoId++)]);
  }, []);

  const removerBloco = useCallback((id) => {
    setBlocos((prev) => {
      if (prev.length === 1) return prev; // mínimo 1 bloco
      return prev.filter((b) => b.id !== id);
    });
  }, []);

  const moverBloco = useCallback((id, direcao) => {
    setBlocos((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (direcao === 'up' && idx === 0) return prev;
      if (direcao === 'down' && idx === prev.length - 1) return prev;
      const novo = [...prev];
      const alvo = direcao === 'up' ? idx - 1 : idx + 1;
      [novo[idx], novo[alvo]] = [novo[alvo], novo[idx]];
      return novo;
    });
  }, []);

  const duplicarBloco = useCallback((id) => {
    setBlocos((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      const copia = { ...prev[idx], id: proximoId++ };
      const novo = [...prev];
      novo.splice(idx + 1, 0, copia);
      return novo;
    });
  }, []);

  const aplicarTemplate = useCallback((template, id) => {
    setBlocos((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              corFundo: template.corFundo,
              corTexto: template.corTexto,
              emoji: template.emoji,
            }
          : b
      )
    );
  }, []);

  // ── Geração de HTML ───────────────────────────────────────────────────────
  const gerarHTML = useCallback(() => {
    const blocosHTML = blocos
      .map((b) => {
        const fontSize = TAMANHO_MAP[b.tamanhoTitulo]?.fontSize ?? '1.375rem';
        const tituloTexto = b.emoji
          ? `${b.emoji} ${b.tituloBLoco}`
          : b.tituloBLoco;
        return `  <div style="background: ${b.corFundo}; color: ${b.corTexto}; padding: 24px; margin-bottom: 16px; border-radius: 12px; text-align: ${b.alinhamento};">
    <h2 style="font-size: ${fontSize}; font-weight: bold; margin-bottom: 12px;">${tituloTexto}</h2>
    <p style="line-height: 1.7; white-space: pre-wrap;">${b.conteudo}</p>
  </div>`;
      })
      .join('\n');

    return `<div style="font-family: sans-serif; max-width: 800px; margin: 0 auto;">\n${blocosHTML}\n</div>`;
  }, [blocos]);

  const handlePublicar = () => {
    if (!tituloInformativo.trim()) {
      alert('Por favor, preencha o título do informativo antes de publicar.');
      return;
    }
    const html = gerarHTML();
    onPublicar(tituloInformativo, html, tagsInformativo);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
      {/* HEADER */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{
          background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
        }}
      >
        <div className="flex items-center gap-3 text-white">
          <Layout size={20} />
          <h2 className="font-extrabold text-lg">Editor de Informativos</h2>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">
            {blocos.length} bloco{blocos.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={onFechar}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
          title="Fechar editor"
        >
          <X size={18} />
        </button>
      </div>

      {/* CORPO: editor + preview */}
      <div className="flex flex-col lg:flex-row min-h-[600px]">
        {/* ── PAINEL ESQUERDO ─────────────────────────────────────────────── */}
        <div className="flex-1 p-4 sm:p-6 space-y-5 overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-100 max-h-[80vh] lg:max-h-none">

          {/* Título e Tags do informativo */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                Título do Informativo
              </label>
              <input
                type="text"
                value={tituloInformativo}
                onChange={(e) => setTituloInformativo(e.target.value)}
                placeholder="Ex: Atualização de Procedimentos — Junho"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm font-medium"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                Tags
              </label>
              <input
                type="text"
                value={tagsInformativo}
                onChange={(e) => setTagsInformativo(e.target.value)}
                placeholder="processos, logistica, sac"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm"
              />
            </div>
          </div>

          {/* Blocos */}
          <div className="space-y-4">
            {blocos.map((bloco, idx) => (
              <BlocoEditor
                key={bloco.id}
                bloco={bloco}
                idx={idx}
                total={blocos.length}
                corPrimaria={corPrimaria}
                onAtualizar={atualizarBloco}
                onRemover={removerBloco}
                onMover={moverBloco}
                onDuplicar={duplicarBloco}
                onAplicarTemplate={aplicarTemplate}
              />
            ))}
          </div>

          {/* Botão adicionar bloco */}
          <button
            onClick={adicionarBloco}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-300 hover:border-blue-400 text-slate-500 hover:text-blue-600 rounded-2xl transition-all font-bold text-sm"
          >
            <Plus size={16} /> Adicionar Bloco
          </button>
        </div>

        {/* ── PAINEL DIREITO: PREVIEW ──────────────────────────────────────── */}
        <div className="w-full lg:w-[420px] xl:w-[480px] p-4 sm:p-6 bg-slate-50 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
            <Layout size={15} />
            Preview em tempo real
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[60vh] lg:max-h-none">
            {tituloInformativo && (
              <h3 className="text-lg font-extrabold text-slate-800 mb-1 break-words">
                {tituloInformativo}
              </h3>
            )}
            {blocos.map((bloco) => (
              <PreviewBloco key={bloco.id} bloco={bloco} />
            ))}
          </div>

          {/* Botão publicar */}
          <button
            onClick={handlePublicar}
            className="flex items-center justify-center gap-2 w-full py-4 text-white font-extrabold rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all text-sm"
            style={{
              background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})`,
            }}
          >
            <Send size={18} />
            Publicar como Comunicado
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-componente: editor de um bloco ─────────────────────────────────────
function BlocoEditor({
  bloco,
  idx,
  total,
  corPrimaria,
  onAtualizar,
  onRemover,
  onMover,
  onDuplicar,
  onAplicarTemplate,
}) {
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Cabeçalho do bloco */}
      <div
        className="px-4 py-2 flex items-center justify-between"
        style={{ background: `${corPrimaria}15` }}
      >
        <span className="text-xs font-black text-slate-600 uppercase tracking-wider">
          Bloco {idx + 1}
        </span>
        <div className="flex items-center gap-1">
          <IconBtn
            title="Mover para cima"
            disabled={idx === 0}
            onClick={() => onMover(bloco.id, 'up')}
          >
            <ChevronUp size={14} />
          </IconBtn>
          <IconBtn
            title="Mover para baixo"
            disabled={idx === total - 1}
            onClick={() => onMover(bloco.id, 'down')}
          >
            <ChevronDown size={14} />
          </IconBtn>
          <IconBtn title="Duplicar bloco" onClick={() => onDuplicar(bloco.id)}>
            <Copy size={14} />
          </IconBtn>
          <IconBtn
            title="Remover bloco"
            disabled={total === 1}
            onClick={() => onRemover(bloco.id)}
            danger
          >
            <Trash2 size={14} />
          </IconBtn>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Templates */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block">
            Templates
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => onAplicarTemplate(t, bloco.id)}
                title={t.label}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all hover:scale-105 active:scale-95"
                style={{
                  background: t.corFundo,
                  color: t.corTexto,
                  border: `1px solid ${t.corFundo === '#ffffff' ? '#e2e8f0' : t.corFundo}`,
                }}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Cores */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              Fundo
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bloco.corFundo}
                onChange={(e) => onAtualizar(bloco.id, 'corFundo', e.target.value)}
                className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
              />
              <span className="text-xs text-slate-500 font-mono">{bloco.corFundo}</span>
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">
              Texto
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bloco.corTexto}
                onChange={(e) => onAtualizar(bloco.id, 'corTexto', e.target.value)}
                className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5"
              />
              <span className="text-xs text-slate-500 font-mono">{bloco.corTexto}</span>
            </div>
          </div>
        </div>

        {/* Alinhamento + Tamanho do título */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">
              Alinhamento
            </label>
            <div className="flex gap-1">
              {[
                { val: 'left', icon: <AlignLeft size={14} /> },
                { val: 'center', icon: <AlignCenter size={14} /> },
                { val: 'right', icon: <AlignRight size={14} /> },
              ].map(({ val, icon }) => (
                <button
                  key={val}
                  onClick={() => onAtualizar(bloco.id, 'alinhamento', val)}
                  className={`flex-1 flex items-center justify-center py-1.5 rounded-lg border transition-all ${
                    bloco.alinhamento === val
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Type size={10} /> Título
            </label>
            <div className="flex gap-1">
              {Object.entries(TAMANHO_MAP).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => onAtualizar(bloco.id, 'tamanhoTitulo', key)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-black transition-all ${
                    bloco.tamanhoTitulo === key
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Emoji */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">
            Emoji (opcional)
          </label>
          <input
            type="text"
            value={bloco.emoji}
            onChange={(e) => onAtualizar(bloco.id, 'emoji', e.target.value)}
            placeholder="⚠️ 🆕 ℹ️ 📌 🏆"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
          />
        </div>

        {/* Título do bloco */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">
            Título do Bloco
          </label>
          <input
            type="text"
            value={bloco.tituloBLoco}
            onChange={(e) => onAtualizar(bloco.id, 'tituloBLoco', e.target.value)}
            placeholder="Ex: Atenção — Novo Procedimento"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
          />
        </div>

        {/* Conteúdo */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">
            Conteúdo
          </label>
          <textarea
            value={bloco.conteudo}
            onChange={(e) => onAtualizar(bloco.id, 'conteudo', e.target.value)}
            placeholder="Descreva o conteúdo deste bloco..."
            rows={4}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm resize-y focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Sub-componente: preview de um bloco ────────────────────────────────────
function PreviewBloco({ bloco }) {
  const fontSize = TAMANHO_MAP[bloco.tamanhoTitulo]?.fontSize ?? '1.375rem';
  const tituloTexto = bloco.emoji
    ? `${bloco.emoji} ${bloco.tituloBLoco}`
    : bloco.tituloBLoco;

  return (
    <div
      style={{
        background: bloco.corFundo,
        color: bloco.corTexto,
        padding: '20px',
        borderRadius: '12px',
        textAlign: bloco.alinhamento,
        border: bloco.corFundo === '#ffffff' ? '1px solid #e2e8f0' : 'none',
      }}
    >
      {tituloTexto && (
        <h2
          style={{
            fontSize,
            fontWeight: 'bold',
            marginBottom: '8px',
            lineHeight: 1.3,
          }}
        >
          {tituloTexto}
        </h2>
      )}
      {bloco.conteudo && (
        <p style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
          {bloco.conteudo}
        </p>
      )}
      {!tituloTexto && !bloco.conteudo && (
        <p style={{ opacity: 0.4, fontSize: '0.8rem', fontStyle: 'italic' }}>
          Bloco vazio — preencha o título ou conteúdo
        </p>
      )}
    </div>
  );
}

// ─── Botão de ícone utilitário ───────────────────────────────────────────────
function IconBtn({ children, onClick, disabled, title, danger }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-lg transition-all ${
        disabled
          ? 'opacity-30 cursor-not-allowed'
          : danger
          ? 'text-red-400 hover:bg-red-50 hover:text-red-600'
          : 'text-slate-500 hover:bg-slate-200 hover:text-slate-700'
      }`}
    >
      {children}
    </button>
  );
}
