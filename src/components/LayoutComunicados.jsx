import { useState } from 'react';
import { Calendar, Tag, Paperclip, Heart, FileText, Star } from 'lucide-react';

// ─── Item de pasta simples (fallback sem hook) ────────────────────────────────
function ItemPasta({ c, cor, onAbrir, onCurtir, usuarioId }) {
  const jaCurtiu = c.curtidas_comunicados?.some(x => x.usuario_id === usuarioId);
  const total = c.curtidas_comunicados?.length || 0;
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onAbrir(c)}>
      <div className="w-0.5 h-4 rounded-full shrink-0" style={{ background: cor + '60' }} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-800 truncate">{c.titulo}</p>
        <span className="text-[10px] text-slate-400">{new Date(c.criado_em).toLocaleDateString('pt-BR')}</span>
      </div>
      <button onClick={(e) => onCurtir(c.id, e)}
        className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
        style={jaCurtiu ? { background: '#ef4444', color: '#fff' } : { background: '#f1f5f9', color: '#94a3b8' }}
      >
        <Heart size={11} className={jaCurtiu ? 'fill-current' : ''} /> {total > 0 && total}
      </button>
    </div>
  );
}

// ─── Card individual reutilizável ─────────────────────────────────────────────
function MetaComunicado({ comunicado, cor }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
      <span className="flex items-center gap-1">
        <Calendar size={12}/> {new Date(comunicado.criado_em).toLocaleDateString('pt-BR')}
      </span>
      <span className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ color: cor, background: cor + '15' }}>
        <Tag size={11}/> {comunicado.tags}
      </span>
      {comunicado.modificado_por_usuario ? (
        <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
          ✏️ {comunicado.modificado_por_usuario.email?.split('@')[0]}
        </span>
      ) : comunicado.autor ? (
        <span className="flex items-center gap-1 text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
          👤 {comunicado.autor.email?.split('@')[0]}
        </span>
      ) : null}
      {comunicado.anexos_comunicados?.length > 0 && (
        <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
          <Paperclip size={11}/> {comunicado.anexos_comunicados.length}
        </span>
      )}
    </div>
  );
}

function BotaoCurtir({ comunicado, usuarioId, onCurtir, cor }) {
  const total = comunicado.curtidas_comunicados?.length || 0;
  const jaCurtiu = comunicado.curtidas_comunicados?.some(c => c.usuario_id === usuarioId);
  return (
    <button
      onClick={(e) => onCurtir(comunicado.id, e)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
      style={jaCurtiu
        ? { background: '#ef4444', color: '#fff' }
        : { background: '#f1f5f9', color: '#64748b' }
      }
    >
      <Heart size={13} className={jaCurtiu ? 'fill-current' : ''} />
      {total > 0 ? total : 'Curtir'}
    </button>
  );
}

// ─── MODO CARDS (padrão) ──────────────────────────────────────────────────────
export function LayoutCards({ comunicados, usuarioId, onAbrir, onCurtir, cor }) {
  return (
    <div className="grid gap-3 sm:gap-4">
      {comunicados.map(c => {
        const jaCurtiu = c.curtidas_comunicados?.some(x => x.usuario_id === usuarioId);
        return (
          <div key={c.id} onClick={() => onAbrir(c)}
            className="group bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 cursor-pointer hover:shadow-lg transition-all flex flex-col relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-3xl opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: cor }}
            />
            <h3 className="font-extrabold text-base sm:text-lg text-slate-800 mb-2 transition-colors"
              style={{}}
              onMouseEnter={e => e.currentTarget.style.color = cor}
              onMouseLeave={e => e.currentTarget.style.color = ''}
            >{c.titulo}</h3>
            <MetaComunicado comunicado={c} cor={cor} />
            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
              <BotaoCurtir comunicado={c} usuarioId={usuarioId} onCurtir={onCurtir} cor={cor} />
              <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: cor }}>
                Ler &rarr;
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MODO LISTA ───────────────────────────────────────────────────────────────
export function LayoutLista({ comunicados, usuarioId, onAbrir, onCurtir, cor }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm divide-y divide-slate-100">
      {comunicados.map(c => {
        const total = c.curtidas_comunicados?.length || 0;
        const jaCurtiu = c.curtidas_comunicados?.some(x => x.usuario_id === usuarioId);
        return (
          <div key={c.id}
            className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 cursor-pointer hover:bg-slate-50 transition-colors group"
            onClick={() => onAbrir(c)}
          >
            {/* Indicador de cor */}
            <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: cor }} />

            {/* Ícone */}
            <div className="shrink-0 p-2 rounded-xl" style={{ background: cor + '15' }}>
              <FileText size={16} style={{ color: cor }} />
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm sm:text-base text-slate-800 truncate group-hover:transition-colors"
                onMouseEnter={e => e.currentTarget.style.color = cor}
                onMouseLeave={e => e.currentTarget.style.color = ''}
              >{c.titulo}</p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-medium">
                <Calendar size={11}/> {new Date(c.criado_em).toLocaleDateString('pt-BR')}
                <span className="px-1.5 py-0.5 rounded font-bold" style={{ color: cor, background: cor + '15' }}>
                  {c.tags}
                </span>
                {c.anexos_comunicados?.length > 0 && (
                  <span className="flex items-center gap-0.5 text-emerald-600">
                    <Paperclip size={10}/> {c.anexos_comunicados.length}
                  </span>
                )}
              </div>
            </div>

            {/* Curtidas */}
            <button onClick={(e) => onCurtir(c.id, e)}
              className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all"
              style={jaCurtiu ? { background: '#ef4444', color: '#fff' } : { background: '#f1f5f9', color: '#94a3b8' }}
            >
              <Heart size={12} className={jaCurtiu ? 'fill-current' : ''} />
              {total > 0 && total}
            </button>

            <span className="shrink-0 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: cor }}>
              &rarr;
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── MODO KANBAN ──────────────────────────────────────────────────────────────
const COLUNAS_KANBAN = [
  { id: 'recente',  label: '🆕 Recentes',   dias: 3 },
  { id: 'semana',   label: '📅 Esta semana', dias: 7 },
  { id: 'antigo',   label: '📦 Anteriores',  dias: Infinity },
];

export function LayoutKanban({ comunicados, usuarioId, onAbrir, onCurtir, cor }) {
  const agora = new Date();

  const colunas = COLUNAS_KANBAN.map(col => {
    const anterior = COLUNAS_KANBAN[COLUNAS_KANBAN.indexOf(col) - 1];
    const minDias = anterior?.dias ?? 0;
    const items = comunicados.filter(c => {
      const dias = (agora - new Date(c.criado_em)) / 86400000;
      return dias >= minDias && dias < col.dias;
    });
    return { ...col, items };
  });

  return (
    <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 hide-scrollbar">
      {colunas.map(col => (
        <div key={col.id} className="shrink-0 w-72 sm:w-80">
          {/* Header coluna */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="font-extrabold text-sm text-slate-700">{col.label}</span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full text-white"
              style={{ background: cor }}
            >{col.items.length}</span>
          </div>

          {/* Cards */}
          <div className="space-y-2">
            {col.items.length === 0 ? (
              <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400 font-medium">
                Nenhum item
              </div>
            ) : col.items.map(c => {
              const jaCurtiu = c.curtidas_comunicados?.some(x => x.usuario_id === usuarioId);
              const total = c.curtidas_comunicados?.length || 0;
              return (
                <div key={c.id} onClick={() => onAbrir(c)}
                  className="bg-white rounded-2xl border border-slate-100 p-4 cursor-pointer hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-sm text-slate-800 leading-snug flex-1 transition-colors"
                      onMouseEnter={e => e.currentTarget.style.color = cor}
                      onMouseLeave={e => e.currentTarget.style.color = ''}
                    >{c.titulo}</h4>
                    <button onClick={(e) => onCurtir(c.id, e)}
                      className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-lg transition-all"
                      style={jaCurtiu ? { background: '#ef4444', color: '#fff' } : { background: '#f1f5f9', color: '#94a3b8' }}
                    >
                      <Heart size={10} className={jaCurtiu ? 'fill-current' : ''} />
                      {total > 0 && total}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: cor, background: cor + '15' }}>
                      {c.tags}
                    </span>
                    {c.anexos_comunicados?.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-emerald-600 bg-emerald-50 flex items-center gap-0.5">
                        <Paperclip size={9}/> {c.anexos_comunicados.length}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">
                    {new Date(c.criado_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MODO FOCO ────────────────────────────────────────────────────────────────
// Mostra apenas os 5 mais recentes, sem distrações
export function LayoutFoco({ comunicados, usuarioId, onAbrir, onCurtir, cor }) {
  const recentes = [...comunicados]
    .sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em))
    .slice(0, 5);

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: cor }} />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Modo Foco — {recentes.length} comunicados prioritários
        </span>
      </div>
      {recentes.map((c, i) => {
        const jaCurtiu = c.curtidas_comunicados?.some(x => x.usuario_id === usuarioId);
        const total = c.curtidas_comunicados?.length || 0;
        return (
          <div key={c.id} onClick={() => onAbrir(c)}
            className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-lg group"
            style={{ borderColor: i === 0 ? cor : '#e2e8f0', background: i === 0 ? cor + '08' : '#fff' }}
          >
            <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-white"
              style={{ background: i === 0 ? cor : '#e2e8f0', color: i === 0 ? '#fff' : '#94a3b8' }}
            >{i + 1}</div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-slate-800 truncate transition-colors"
                onMouseEnter={e => e.currentTarget.style.color = cor}
                onMouseLeave={e => e.currentTarget.style.color = ''}
              >{c.titulo}</p>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                {new Date(c.criado_em).toLocaleDateString('pt-BR')} · {c.tags}
              </p>
            </div>
            <button onClick={(e) => onCurtir(c.id, e)}
              className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
              style={jaCurtiu ? { background: '#ef4444', color: '#fff' } : { background: '#f1f5f9', color: '#94a3b8' }}
            >
              <Heart size={12} className={jaCurtiu ? 'fill-current' : ''} /> {total > 0 && total}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── MODO COMPACTO ────────────────────────────────────────────────────────────
// Densidade máxima, sem padding excessivo
export function LayoutCompacto({ comunicados, usuarioId, onAbrir, onCurtir, cor }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      {comunicados.map((c, i) => {
        const total = c.curtidas_comunicados?.length || 0;
        const jaCurtiu = c.curtidas_comunicados?.some(x => x.usuario_id === usuarioId);
        return (
          <div key={c.id}
            className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group"
            onClick={() => onAbrir(c)}
          >
            <span className="text-[10px] font-black text-slate-300 w-5 shrink-0 text-right">{i + 1}</span>
            <div className="w-0.5 h-4 rounded-full shrink-0" style={{ background: cor }} />
            <p className="flex-1 text-sm font-semibold text-slate-700 truncate transition-colors"
              onMouseEnter={e => e.currentTarget.style.color = cor}
              onMouseLeave={e => e.currentTarget.style.color = ''}
            >{c.titulo}</p>
            <span className="text-[10px] text-slate-400 shrink-0 hidden sm:block">
              {new Date(c.criado_em).toLocaleDateString('pt-BR')}
            </span>
            <button onClick={(e) => onCurtir(c.id, e)}
              className="shrink-0 flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded transition-all"
              style={jaCurtiu ? { background: '#ef4444', color: '#fff' } : { color: '#cbd5e1' }}
            >
              <Heart size={10} className={jaCurtiu ? 'fill-current' : ''} />
              {total > 0 && total}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── MODO MAGAZINE ────────────────────────────────────────────────────────────
// Primeiro item em destaque grande, resto em grid
export function LayoutMagazine({ comunicados, usuarioId, onAbrir, onCurtir, cor }) {
  if (comunicados.length === 0) return null;
  const [destaque, ...resto] = comunicados;
  const jaCurtiuDestaque = destaque.curtidas_comunicados?.some(x => x.usuario_id === usuarioId);
  const totalDestaque = destaque.curtidas_comunicados?.length || 0;

  return (
    <div className="space-y-4">
      {/* Destaque */}
      <div onClick={() => onAbrir(destaque)}
        className="group relative bg-white rounded-3xl border-2 cursor-pointer hover:shadow-xl transition-all overflow-hidden p-6 sm:p-8"
        style={{ borderColor: cor }}
      >
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${cor}, ${cor}80)` }} />
        <div className="flex items-start justify-between gap-4 mb-3">
          <span className="text-[10px] font-black px-2 py-1 rounded-full text-white uppercase tracking-wider"
            style={{ background: cor }}
          >⭐ Destaque</span>
          <button onClick={(e) => onCurtir(destaque.id, e)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            style={jaCurtiuDestaque ? { background: '#ef4444', color: '#fff' } : { background: '#f1f5f9', color: '#64748b' }}
          >
            <Heart size={13} className={jaCurtiuDestaque ? 'fill-current' : ''} />
            {totalDestaque > 0 ? totalDestaque : 'Curtir'}
          </button>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 mb-3 transition-colors"
          onMouseEnter={e => e.currentTarget.style.color = cor}
          onMouseLeave={e => e.currentTarget.style.color = ''}
        >{destaque.titulo}</h2>
        <MetaComunicado comunicado={destaque} cor={cor} />
        <p className="mt-3 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: cor }}>
          Ler comunicado completo &rarr;
        </p>
      </div>

      {/* Grid dos demais */}
      {resto.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {resto.map(c => {
            const jaCurtiu = c.curtidas_comunicados?.some(x => x.usuario_id === usuarioId);
            const total = c.curtidas_comunicados?.length || 0;
            return (
              <div key={c.id} onClick={() => onAbrir(c)}
                className="group bg-white rounded-2xl border border-slate-100 p-4 cursor-pointer hover:shadow-md transition-all"
              >
                <h4 className="font-bold text-sm text-slate-800 mb-2 line-clamp-2 transition-colors"
                  onMouseEnter={e => e.currentTarget.style.color = cor}
                  onMouseLeave={e => e.currentTarget.style.color = ''}
                >{c.titulo}</h4>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: cor, background: cor + '15' }}>
                    {c.tags}
                  </span>
                  <button onClick={(e) => onCurtir(c.id, e)}
                    className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded transition-all"
                    style={jaCurtiu ? { background: '#ef4444', color: '#fff' } : { color: '#cbd5e1' }}
                  >
                    <Heart size={10} className={jaCurtiu ? 'fill-current' : ''} />
                    {total > 0 && total}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── MODO TIMELINE ────────────────────────────────────────────────────────────
export function LayoutTimeline({ comunicados, usuarioId, onAbrir, onCurtir, cor }) {
  return (
    <div className="relative max-w-3xl mx-auto">
      <div className="absolute left-5 top-0 bottom-0 w-0.5" style={{ background: cor + '30' }} />
      <div className="space-y-5 pl-14">
        {comunicados.map((c, i) => {
          const jaCurtiu = c.curtidas_comunicados?.some(x => x.usuario_id === usuarioId);
          const total = c.curtidas_comunicados?.length || 0;
          return (
            <div key={c.id} className="relative">
              <div className="absolute -left-9 top-4 w-4 h-4 rounded-full border-2 border-white shadow-md"
                style={{ background: i === 0 ? cor : cor + '60' }} />
              <div onClick={() => onAbrir(c)}
                className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      {new Date(c.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <h4 className="font-extrabold text-slate-800 mt-0.5 transition-colors"
                      onMouseEnter={e => e.currentTarget.style.color = cor}
                      onMouseLeave={e => e.currentTarget.style.color = ''}
                    >{c.titulo}</h4>
                  </div>
                  <button onClick={(e) => onCurtir(c.id, e)}
                    className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
                    style={jaCurtiu ? { background: '#ef4444', color: '#fff' } : { background: '#f1f5f9', color: '#94a3b8' }}
                  >
                    <Heart size={11} className={jaCurtiu ? 'fill-current' : ''} /> {total > 0 && total}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: cor, background: cor + '15' }}>{c.tags}</span>
                  {c.anexos_comunicados?.length > 0 && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <Paperclip size={9}/> {c.anexos_comunicados.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MODO GALERIA ─────────────────────────────────────────────────────────────
export function LayoutGaleria({ comunicados, usuarioId, onAbrir, onCurtir, cor }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {comunicados.map((c, i) => {
        const jaCurtiu = c.curtidas_comunicados?.some(x => x.usuario_id === usuarioId);
        const total = c.curtidas_comunicados?.length || 0;
        return (
          <div key={c.id} onClick={() => onAbrir(c)}
            className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="h-2" style={{ background: `linear-gradient(90deg, ${cor}, ${cor}80)` }} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
                  style={{ background: cor }}
                >{i + 1}</div>
                <button onClick={(e) => onCurtir(c.id, e)}
                  className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                  style={jaCurtiu ? { background: '#ef4444', color: '#fff' } : { background: '#f1f5f9', color: '#94a3b8' }}
                >
                  <Heart size={10} className={jaCurtiu ? 'fill-current' : ''} /> {total > 0 && total}
                </button>
              </div>
              <h3 className="font-extrabold text-slate-800 mb-2 line-clamp-2 transition-colors"
                onMouseEnter={e => e.currentTarget.style.color = cor}
                onMouseLeave={e => e.currentTarget.style.color = ''}
              >{c.titulo}</h3>
              <div className="flex flex-wrap gap-1.5 mb-4">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: cor, background: cor + '15' }}>{c.tags}</span>
                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5">
                  <Calendar size={9}/> {new Date(c.criado_em).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: cor }}>
                Ler comunicado &rarr;
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MODO TABELA ──────────────────────────────────────────────────────────────
export function LayoutTabela({ comunicados, usuarioId, onAbrir, onCurtir, cor }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: cor + '10', borderBottom: `2px solid ${cor}30` }}>
              <th className="text-left px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider">#</th>
              <th className="text-left px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider">Título</th>
              <th className="text-left px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider hidden sm:table-cell">Tags</th>
              <th className="text-left px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider hidden md:table-cell">Data</th>
              <th className="text-center px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider hidden md:table-cell">❤️</th>
              <th className="text-right px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {comunicados.map((c, i) => {
              const jaCurtiu = c.curtidas_comunicados?.some(x => x.usuario_id === usuarioId);
              const total = c.curtidas_comunicados?.length || 0;
              return (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onAbrir(c)}>
                  <td className="px-4 py-3 text-xs font-black text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800 max-w-xs truncate">{c.titulo}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: cor, background: cor + '15' }}>{c.tags}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell">{new Date(c.criado_em).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <button onClick={(e) => onCurtir(c.id, e)}
                      className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg transition-all"
                      style={jaCurtiu ? { background: '#ef4444', color: '#fff' } : { color: '#94a3b8' }}
                    >
                      <Heart size={10} className={jaCurtiu ? 'fill-current' : ''} /> {total}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-bold" style={{ color: cor }}>Ver &rarr;</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── MODO PASTAS ──────────────────────────────────────────────────────────────
export function LayoutPastas({ comunicados, usuarioId, onAbrir, onCurtir, cor, pastasHook }) {
  const [novaPasta, setNovaPasta] = useState('');
  const [moverItem, setMoverItem] = useState(null); // { id, titulo }
  const [editandoPasta, setEditandoPasta] = useState(null); // pastaId
  const [nomeEditando, setNomeEditando] = useState('');

  // Se não tem hook de pastas, fallback para agrupamento por tags
  if (!pastasHook) {
    // Fallback: agrupar por tag "cat:"
    const grupos = {};
    comunicados.forEach(c => {
      const catTag = c.tags?.split(',').map(t => t.trim()).find(t => t.startsWith('cat:'));
      const cat = catTag ? catTag.replace('cat:', '').trim() : 'Geral';
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(c);
    });
    const categorias = Object.entries(grupos).sort(([a], [b]) =>
      a === 'Geral' ? 1 : b === 'Geral' ? -1 : a.localeCompare(b)
    );

    return (
      <div className="space-y-3">
        {categorias.map(([cat, itens]) => (
          <details key={cat} className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" open>
            <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none hover:bg-slate-50 transition-colors list-none">
              <span className="text-lg">📁</span>
              <span className="font-extrabold text-slate-800 flex-1">{cat}</span>
              <span className="text-xs font-black px-2.5 py-1 rounded-full text-white" style={{ background: cor }}>{itens.length}</span>
              <svg className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="divide-y divide-slate-50 border-t border-slate-100">
              {itens.map(c => (
                <ItemPasta key={c.id} c={c} cor={cor} onAbrir={onAbrir} onCurtir={onCurtir} usuarioId={usuarioId} />
              ))}
            </div>
          </details>
        ))}
      </div>
    );
  }

  const { pastas, criarPasta, renomearPasta, excluirPasta, reordenarPastas, moverParaPasta, reordenarItem, organizarEmPastas } = pastasHook;
  const pastasOrganizadas = organizarEmPastas(comunicados);

  return (
    <div className="space-y-4">
      {/* Barra de criação de pasta */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
        <span className="text-lg">📁</span>
        <input
          type="text"
          value={novaPasta}
          onChange={e => setNovaPasta(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && novaPasta.trim()) { criarPasta(novaPasta.trim()); setNovaPasta(''); } }}
          placeholder="Nova pasta... (Enter para criar)"
          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 transition-all"
          style={{ '--tw-ring-color': cor }}
        />
        <button
          onClick={() => { if (novaPasta.trim()) { criarPasta(novaPasta.trim()); setNovaPasta(''); } }}
          disabled={!novaPasta.trim()}
          className="px-3 py-2 text-xs font-bold text-white rounded-xl transition-all active:scale-95 disabled:opacity-40"
          style={{ background: cor }}
        >
          + Criar
        </button>
      </div>

      {/* Modal de mover item */}
      {moverItem && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in"
          onClick={() => setMoverItem(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h3 className="font-extrabold text-slate-800 mb-1 text-base">Mover para pasta</h3>
            <p className="text-xs text-slate-500 mb-4 truncate">"{moverItem.titulo}"</p>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {pastas.map(p => (
                <button
                  key={p.id}
                  onClick={() => { moverParaPasta(moverItem.id, p.id); setMoverItem(null); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:bg-slate-50 border border-slate-100"
                >
                  <span className="text-lg">📁</span>
                  <span className="font-bold text-sm text-slate-700 flex-1">{p.nome}</span>
                  {pastasHook.getPastaDoComunicado(moverItem.id) === p.id && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: cor }}>Atual</span>
                  )}
                </button>
              ))}
            </div>
            <button onClick={() => setMoverItem(null)} className="w-full mt-3 py-2.5 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Pastas */}
      {pastasOrganizadas.map(({ pasta, itens }) => (
        <details key={pasta.id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" open>
          <summary className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 cursor-pointer select-none hover:bg-slate-50 transition-colors list-none">
            {/* Reordenar pasta */}
            {pasta.id !== '__geral__' && (
              <div className="flex flex-col gap-0.5 shrink-0">
                <button onClick={(e) => { e.preventDefault(); reordenarPastas(pasta.id, 'up'); }}
                  className="text-slate-300 hover:text-slate-600 transition-colors p-0.5"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-8 8h16z"/></svg>
                </button>
                <button onClick={(e) => { e.preventDefault(); reordenarPastas(pasta.id, 'down'); }}
                  className="text-slate-300 hover:text-slate-600 transition-colors p-0.5"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l8-8H4z"/></svg>
                </button>
              </div>
            )}

            <span className="text-lg shrink-0">📁</span>

            {/* Nome editável */}
            {editandoPasta === pasta.id ? (
              <input
                autoFocus
                value={nomeEditando}
                onChange={e => setNomeEditando(e.target.value)}
                onBlur={() => { if (nomeEditando.trim()) renomearPasta(pasta.id, nomeEditando.trim()); setEditandoPasta(null); }}
                onKeyDown={e => { if (e.key === 'Enter') { if (nomeEditando.trim()) renomearPasta(pasta.id, nomeEditando.trim()); setEditandoPasta(null); } }}
                className="flex-1 px-2 py-1 text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg outline-none"
                onClick={e => e.preventDefault()}
              />
            ) : (
              <span className="font-extrabold text-slate-800 flex-1 min-w-0 truncate">{pasta.nome}</span>
            )}

            <span className="text-xs font-black px-2 py-0.5 rounded-full text-white shrink-0" style={{ background: cor }}>{itens.length}</span>

            {/* Ações da pasta */}
            {pasta.id !== '__geral__' && (
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={(e) => { e.preventDefault(); setEditandoPasta(pasta.id); setNomeEditando(pasta.nome); }}
                  className="p-1 text-slate-400 hover:text-blue-500 rounded transition-colors" title="Renomear"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button onClick={(e) => { e.preventDefault(); if (window.confirm(`Excluir pasta "${pasta.nome}"? Os itens serão movidos para Geral.`)) excluirPasta(pasta.id); }}
                  className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors" title="Excluir pasta"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
              </div>
            )}

            <svg className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>

          {/* Itens da pasta */}
          <div className="divide-y divide-slate-50 border-t border-slate-100">
            {itens.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6 italic">Pasta vazia — mova comunicados para cá</p>
            ) : itens.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2 px-4 sm:px-5 py-3 hover:bg-slate-50 transition-colors group">
                {/* Reordenar item */}
                <div className="flex flex-col gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => reordenarItem(pasta.id, c.id, 'up', itens.map(x => x.id))}
                    className="text-slate-300 hover:text-slate-600 p-0.5"
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-8 8h16z"/></svg>
                  </button>
                  <button onClick={() => reordenarItem(pasta.id, c.id, 'down', itens.map(x => x.id))}
                    className="text-slate-300 hover:text-slate-600 p-0.5"
                  >
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l8-8H4z"/></svg>
                  </button>
                </div>

                <span className="text-xs font-black text-slate-300 w-4 text-right shrink-0">{i + 1}</span>
                <div className="w-0.5 h-4 rounded-full shrink-0" style={{ background: cor + '60' }} />

                {/* Conteúdo */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onAbrir(c)}>
                  <p className="font-semibold text-sm text-slate-800 truncate">{c.titulo}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400">{new Date(c.criado_em).toLocaleDateString('pt-BR')}</span>
                    <span className="text-[10px] text-red-400 flex items-center gap-0.5">
                      <Heart size={9} className="fill-current"/> {c.curtidas_comunicados?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setMoverItem({ id: c.id, titulo: c.titulo })}
                    className="p-1.5 text-slate-400 hover:text-blue-500 bg-slate-50 rounded-lg transition-colors" title="Mover para outra pasta"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                    </svg>
                  </button>
                  <button onClick={(e) => onCurtir(c.id, e)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={c.curtidas_comunicados?.some(x => x.usuario_id === usuarioId)
                      ? { background: '#ef4444', color: '#fff' }
                      : { background: '#f1f5f9', color: '#94a3b8' }
                    }
                  >
                    <Heart size={11} className={c.curtidas_comunicados?.some(x => x.usuario_id === usuarioId) ? 'fill-current' : ''} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

// ─── Dispatcher principal ─────────────────────────────────────────────────────
export default function LayoutComunicados({ layout, modeFoco, organizacao, comunicados, usuarioId, onAbrir, onCurtir, cor, pastasHook }) {
  if (comunicados.length === 0) {
    return <p className="text-center text-slate-400 py-10">Nenhum comunicado encontrado.</p>;
  }

  // Modo foco sobrepõe qualquer layout
  if (modeFoco) {
    return <LayoutFoco comunicados={comunicados} usuarioId={usuarioId} onAbrir={onAbrir} onCurtir={onCurtir} cor={cor} />;
  }

  // Organização por pastas sobrepõe o layout visual
  if ((organizacao || 'livre') === 'pastas') {
    return <LayoutPastas comunicados={comunicados} usuarioId={usuarioId} onAbrir={onAbrir} onCurtir={onCurtir} cor={cor} pastasHook={pastasHook} />;
  }

  switch (layout) {
    case 'lista':     return <LayoutLista     comunicados={comunicados} usuarioId={usuarioId} onAbrir={onAbrir} onCurtir={onCurtir} cor={cor} />;
    case 'kanban':    return <LayoutKanban    comunicados={comunicados} usuarioId={usuarioId} onAbrir={onAbrir} onCurtir={onCurtir} cor={cor} />;
    case 'compacto':  return <LayoutCompacto  comunicados={comunicados} usuarioId={usuarioId} onAbrir={onAbrir} onCurtir={onCurtir} cor={cor} />;
    case 'magazine':  return <LayoutMagazine  comunicados={comunicados} usuarioId={usuarioId} onAbrir={onAbrir} onCurtir={onCurtir} cor={cor} />;
    case 'timeline':  return <LayoutTimeline  comunicados={comunicados} usuarioId={usuarioId} onAbrir={onAbrir} onCurtir={onCurtir} cor={cor} />;
    case 'galeria':   return <LayoutGaleria   comunicados={comunicados} usuarioId={usuarioId} onAbrir={onAbrir} onCurtir={onCurtir} cor={cor} />;
    case 'tabela':    return <LayoutTabela    comunicados={comunicados} usuarioId={usuarioId} onAbrir={onAbrir} onCurtir={onCurtir} cor={cor} />;
    default:          return <LayoutCards     comunicados={comunicados} usuarioId={usuarioId} onAbrir={onAbrir} onCurtir={onCurtir} cor={cor} />;
  }
}
