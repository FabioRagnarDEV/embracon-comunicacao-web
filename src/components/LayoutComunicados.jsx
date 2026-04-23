import { Calendar, Tag, Paperclip, Heart, FileText, Star } from 'lucide-react';

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

// ─── Dispatcher principal ─────────────────────────────────────────────────────
export default function LayoutComunicados({ layout, modeFoco, comunicados, usuarioId, onAbrir, onCurtir, cor }) {
  if (comunicados.length === 0) {
    return <p className="text-center text-slate-400 py-10">Nenhum comunicado encontrado.</p>;
  }

  // Modo foco sobrepõe qualquer layout
  if (modeFoco) {
    return <LayoutFoco comunicados={comunicados} usuarioId={usuarioId} onAbrir={onAbrir} onCurtir={onCurtir} cor={cor} />;
  }

  switch (layout) {
    case 'lista':     return <LayoutLista     comunicados={comunicados} usuarioId={usuarioId} onAbrir={onAbrir} onCurtir={onCurtir} cor={cor} />;
    case 'kanban':    return <LayoutKanban    comunicados={comunicados} usuarioId={usuarioId} onAbrir={onAbrir} onCurtir={onCurtir} cor={cor} />;
    case 'compacto':  return <LayoutCompacto  comunicados={comunicados} usuarioId={usuarioId} onAbrir={onAbrir} onCurtir={onCurtir} cor={cor} />;
    case 'magazine':  return <LayoutMagazine  comunicados={comunicados} usuarioId={usuarioId} onAbrir={onAbrir} onCurtir={onCurtir} cor={cor} />;
    default:          return <LayoutCards     comunicados={comunicados} usuarioId={usuarioId} onAbrir={onAbrir} onCurtir={onCurtir} cor={cor} />;
  }
}
