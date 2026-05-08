import { Copy, Edit2, Trash2, Lock, Globe, Paperclip, FileText } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function BadgeVisibilidade({ script, cor }) {
  return (
    <span
      title={script.visivel_equipe ? 'Público' : 'Privado'}
      className="p-1.5 rounded-lg shrink-0"
      style={script.visivel_equipe
        ? { background: cor + '15', color: cor }
        : { background: '#f1f5f9', color: '#94a3b8' }
      }
    >
      {script.visivel_equipe ? <Globe size={14} /> : <Lock size={14} />}
    </span>
  );
}

function AnexosBadge({ script, cor }) {
  if (!script.anexos_scripts?.length) return null;
  return (
    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded w-fit flex items-center gap-1 font-bold">
      <Paperclip size={10} /> {script.anexos_scripts.length} anexo(s)
    </span>
  );
}

function BotoesAcao({ script, tipo, cor, onCopiar, onEditar, onDeletar, decodificarHTML }) {
  const corSecundaria = cor;
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => onCopiar(decodificarHTML(script.conteudo), script.titulo, e)}
        className="flex-1 flex items-center justify-center gap-2 text-white font-bold py-2.5 rounded-xl transition-all active:scale-95"
        style={{ background: `linear-gradient(135deg, ${cor}, ${corSecundaria})` }}
      >
        <Copy size={16} /> Copiar
      </button>
      {tipo === 'meus' && onEditar && (
        <button
          onClick={(e) => onEditar(script, e)}
          className="p-2.5 bg-orange-50 hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600 text-orange-600 hover:text-white rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-orange-200 active:scale-95"
        >
          <Edit2 size={16} />
        </button>
      )}
      {tipo === 'meus' && onDeletar && (
        <button
          onClick={(e) => onDeletar(script.id, e)}
          className="p-2.5 bg-red-50 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 text-red-500 hover:text-white rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-red-200 active:scale-95"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

// ─── MODO CARDS (padrão) ──────────────────────────────────────────────────────
function LayoutCards({ scripts, tipo, cor, onAbrir, onCopiar, onEditar, onDeletar, decodificarHTML }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
      {scripts.map(script => (
        <div
          key={script.id}
          onClick={() => onAbrir(script)}
          className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col h-full shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-4">
            <h4
              className="font-extrabold text-slate-800 group-hover:transition-colors"
              onMouseEnter={e => e.currentTarget.style.color = cor}
              onMouseLeave={e => e.currentTarget.style.color = ''}
            >
              {script.titulo}
            </h4>
            <BadgeVisibilidade script={script} cor={cor} />
          </div>

          <AnexosBadge script={script} cor={cor} />

          {tipo === 'equipe' && (
            <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">
              Criado por: <strong className="text-slate-600">{script.usuarios?.nome_completo || 'Desconhecido'}</strong>
            </p>
          )}

          <div
            className="flex-1 mb-6 text-sm text-slate-600 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: decodificarHTML(script.conteudo) }}
          />

          <div className="mt-auto pt-4 border-t border-slate-100">
            <BotoesAcao
              script={script}
              tipo={tipo}
              cor={cor}
              onCopiar={onCopiar}
              onEditar={onEditar}
              onDeletar={onDeletar}
              decodificarHTML={decodificarHTML}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── MODO LISTA ───────────────────────────────────────────────────────────────
function LayoutLista({ scripts, tipo, cor, onAbrir, onCopiar, decodificarHTML }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm divide-y divide-slate-100">
      {scripts.map(script => (
        <div
          key={script.id}
          className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-4 cursor-pointer hover:bg-slate-50 transition-colors group"
          onClick={() => onAbrir(script)}
        >
          <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: cor }} />

          <div className="shrink-0 p-2 rounded-xl" style={{ background: cor + '15' }}>
            <FileText size={16} style={{ color: cor }} />
          </div>

          <div className="flex-1 min-w-0">
            <p
              className="font-bold text-sm sm:text-base text-slate-800 truncate group-hover:transition-colors"
              onMouseEnter={e => e.currentTarget.style.color = cor}
              onMouseLeave={e => e.currentTarget.style.color = ''}
            >
              {script.titulo}
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-medium">
              <BadgeVisibilidade script={script} cor={cor} />
              {tipo === 'equipe' && (
                <span className="text-slate-400">por {script.usuarios?.nome_completo || 'Desconhecido'}</span>
              )}
              {script.anexos_scripts?.length > 0 && (
                <span className="flex items-center gap-0.5 text-emerald-600">
                  <Paperclip size={10} /> {script.anexos_scripts.length}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={(e) => onCopiar(decodificarHTML(script.conteudo), script.titulo, e)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-white font-bold text-xs rounded-xl transition-all active:scale-95"
            style={{ background: cor }}
          >
            <Copy size={12} /> Copiar
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── MODO COMPACTO ────────────────────────────────────────────────────────────
function LayoutCompacto({ scripts, tipo, cor, onAbrir, onCopiar, decodificarHTML }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      {scripts.map((script, i) => (
        <div
          key={script.id}
          className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group"
          onClick={() => onAbrir(script)}
        >
          <span className="text-[10px] font-black text-slate-300 w-5 shrink-0 text-right">{i + 1}</span>
          <div className="w-0.5 h-4 rounded-full shrink-0" style={{ background: cor }} />
          <p
            className="flex-1 text-sm font-semibold text-slate-700 truncate transition-colors"
            onMouseEnter={e => e.currentTarget.style.color = cor}
            onMouseLeave={e => e.currentTarget.style.color = ''}
          >
            {script.titulo}
          </p>
          <span className="shrink-0" title={script.visivel_equipe ? 'Público' : 'Privado'}>
            {script.visivel_equipe
              ? <Globe size={11} style={{ color: cor }} />
              : <Lock size={11} className="text-slate-400" />
            }
          </span>
          {tipo === 'equipe' && (
            <span className="text-[10px] text-slate-400 shrink-0 hidden sm:block">
              {script.usuarios?.nome_completo || 'Desconhecido'}
            </span>
          )}
          <button
            onClick={(e) => onCopiar(decodificarHTML(script.conteudo), script.titulo, e)}
            className="shrink-0 flex items-center gap-0.5 text-[10px] font-bold px-2 py-1 rounded-lg transition-all text-white active:scale-95"
            style={{ background: cor }}
          >
            <Copy size={10} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── MODO TABELA ──────────────────────────────────────────────────────────────
function LayoutTabela({ scripts, tipo, cor, onAbrir, onCopiar, onEditar, onDeletar, decodificarHTML }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: cor + '10', borderBottom: `2px solid ${cor}30` }}>
              <th className="text-left px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider">#</th>
              <th className="text-left px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider">Título</th>
              <th className="text-left px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider hidden sm:table-cell">Visibilidade</th>
              {tipo === 'equipe' && (
                <th className="text-left px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider hidden md:table-cell">Autor</th>
              )}
              <th className="text-right px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {scripts.map((script, i) => (
              <tr key={script.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onAbrir(script)}>
                <td className="px-4 py-3 text-xs font-black text-slate-400">{i + 1}</td>
                <td className="px-4 py-3 font-semibold text-slate-800 max-w-xs truncate">{script.titulo}</td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"
                    style={script.visivel_equipe
                      ? { color: cor, background: cor + '15' }
                      : { color: '#94a3b8', background: '#f1f5f9' }
                    }
                  >
                    {script.visivel_equipe ? <><Globe size={10} /> Público</> : <><Lock size={10} /> Privado</>}
                  </span>
                </td>
                {tipo === 'equipe' && (
                  <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">
                    {script.usuarios?.nome_completo || 'Desconhecido'}
                  </td>
                )}
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => onCopiar(decodificarHTML(script.conteudo), script.titulo, e)}
                      className="text-xs font-bold px-2 py-1 rounded-lg text-white transition-all active:scale-95"
                      style={{ background: cor }}
                    >
                      <Copy size={12} />
                    </button>
                    {tipo === 'meus' && onEditar && (
                      <button
                        onClick={(e) => onEditar(script, e)}
                        className="text-xs font-bold px-2 py-1 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white transition-all active:scale-95"
                      >
                        <Edit2 size={12} />
                      </button>
                    )}
                    {tipo === 'meus' && onDeletar && (
                      <button
                        onClick={(e) => onDeletar(script.id, e)}
                        className="text-xs font-bold px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── MODO GALERIA ─────────────────────────────────────────────────────────────
function LayoutGaleria({ scripts, tipo, cor, onAbrir, onCopiar, onEditar, onDeletar, decodificarHTML }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {scripts.map((script, i) => (
        <div
          key={script.id}
          onClick={() => onAbrir(script)}
          className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
        >
          <div className="h-2" style={{ background: `linear-gradient(90deg, ${cor}, ${cor}80)` }} />
          <div className="p-5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0"
                style={{ background: cor }}
              >
                {i + 1}
              </div>
              <BadgeVisibilidade script={script} cor={cor} />
            </div>
            <h3
              className="font-extrabold text-slate-800 mb-2 line-clamp-2 transition-colors"
              onMouseEnter={e => e.currentTarget.style.color = cor}
              onMouseLeave={e => e.currentTarget.style.color = ''}
            >
              {script.titulo}
            </h3>

            {tipo === 'equipe' && (
              <p className="text-xs text-slate-400 font-medium mb-3">
                por {script.usuarios?.nome_completo || 'Desconhecido'}
              </p>
            )}

            <div
              className="text-sm text-slate-600 line-clamp-2 mb-4"
              dangerouslySetInnerHTML={{ __html: decodificarHTML(script.conteudo) }}
            />

            <div className="pt-3 border-t border-slate-100">
              <BotoesAcao
                script={script}
                tipo={tipo}
                cor={cor}
                onCopiar={onCopiar}
                onEditar={onEditar}
                onDeletar={onDeletar}
                decodificarHTML={decodificarHTML}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Dispatcher principal ─────────────────────────────────────────────────────
export default function LayoutScripts({ layout, scripts, tipo, cor, onAbrir, onCopiar, onEditar, onDeletar, decodificarHTML }) {
  if (!scripts || scripts.length === 0) return null;

  const props = { scripts, tipo, cor, onAbrir, onCopiar, onEditar, onDeletar, decodificarHTML };

  switch (layout) {
    case 'lista':
      return <LayoutLista {...props} />;
    case 'compacto':
      return <LayoutCompacto {...props} />;
    case 'tabela':
      return <LayoutTabela {...props} />;
    case 'galeria':
      return <LayoutGaleria {...props} />;
    // Fallback para cards nos layouts que não têm versão específica para scripts
    case 'kanban':
    case 'magazine':
    case 'timeline':
    case 'pastas':
    default:
      return <LayoutCards {...props} />;
  }
}
