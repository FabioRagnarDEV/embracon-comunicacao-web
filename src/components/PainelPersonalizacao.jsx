import { useRef } from 'react';
import {
  X, Palette, Type, Layout, Image, Zap, Star, RotateCcw, Save,
  Sun, Moon, Minimize2, Eye, ChevronRight, Check, Heart, Sliders,
  Monitor, Sparkles, Target, Upload
} from 'lucide-react';
import { TEMAS_PREDEFINIDOS, PERFIS_PREDEFINIDOS, PADRAO } from '../hooks/usePersonalizacao';

const ABAS = [
  { id: 'temas',    label: 'Temas',     icon: Palette },
  { id: 'cores',    label: 'Cores',     icon: Sliders },
  { id: 'tipografia', label: 'Texto',   icon: Type },
  { id: 'layout',   label: 'Layout',    icon: Layout },
  { id: 'fundo',    label: 'Fundo',     icon: Image },
  { id: 'efeitos',  label: 'Efeitos',   icon: Sparkles },
  { id: 'perfis',   label: 'Perfis',    icon: Star },
];

const FONTES = [
  { id: 'inter',   nome: 'Inter (Padrão)' },
  { id: 'poppins', nome: 'Poppins' },
  { id: 'roboto',  nome: 'Roboto' },
  { id: 'mono',    nome: 'Monospace' },
];

const LAYOUTS = [
  { id: 'cards',     nome: 'Cards',      desc: 'Grade de cartões',          icon: '▦' },
  { id: 'lista',     nome: 'Lista',      desc: 'Linhas compactas',          icon: '☰' },
  { id: 'kanban',    nome: 'Kanban',     desc: 'Colunas por data',          icon: '⊞' },
  { id: 'compacto',  nome: 'Compacto',   desc: 'Máxima densidade',          icon: '≡' },
  { id: 'magazine',  nome: 'Magazine',   desc: 'Destaque + grade',          icon: '◈' },
];

export default function PainelPersonalizacao({
  rascunho, abaSelecionada, setAbaSelecionada,
  atualizar, aplicarTema, salvar, resetar, salvarPerfil, carregarPerfil, favoritarTema,
  onFechar,
}) {
  const fileRef = useRef(null);

  const handleImagemFundo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => atualizar('imagemFundo', ev.target.result);
    reader.readAsDataURL(file);
  };

  const corCard = rascunho.tema === 'escuro' ? '#1e293b' : '#ffffff';
  const corBorda = rascunho.tema === 'escuro' ? '#334155' : '#e2e8f0';
  const corTextoSec = rascunho.tema === 'escuro' ? '#94a3b8' : '#64748b';
  const corFundoPainel = rascunho.tema === 'escuro' ? '#0f172a' : '#f8fafc';
  const corFundoAba = rascunho.tema === 'escuro' ? '#1e293b' : '#ffffff';

  return (
    <div
      className="fixed inset-0 z-[300] flex justify-end"
      style={{ fontFamily: 'inherit' }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onFechar}
      />

      {/* Painel */}
      <div
        className="relative z-10 w-full max-w-sm sm:max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
        style={{ background: corFundoPainel, color: rascunho.corTexto }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{ borderColor: corBorda, background: corCard }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl"
              style={{ background: rascunho.corPrimaria + '20' }}
            >
              <Palette size={20} style={{ color: rascunho.corPrimaria }} />
            </div>
            <div>
              <h2 className="font-extrabold text-base" style={{ color: rascunho.corTexto }}>
                Personalize do seu jeito
              </h2>
              <p className="text-xs" style={{ color: corTextoSec }}>
                Suas preferências são salvas localmente
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="p-2 rounded-xl transition-colors hover:bg-slate-100/10"
            style={{ color: corTextoSec }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Abas ── */}
        <div
          className="flex overflow-x-auto hide-scrollbar gap-1 px-3 py-2 border-b shrink-0"
          style={{ borderColor: corBorda, background: corCard }}
        >
          {ABAS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setAbaSelecionada(id)}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all shrink-0"
              style={abaSelecionada === id
                ? { background: rascunho.corPrimaria, color: '#fff' }
                : { color: corTextoSec }
              }
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Conteúdo ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

          {/* ── TEMAS ── */}
          {abaSelecionada === 'temas' && (
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: corTextoSec }}>
                Temas pré-definidos
              </p>
              <div className="grid grid-cols-2 gap-2">
                {TEMAS_PREDEFINIDOS.map((tema) => {
                  const isFav = rascunho.temasFavoritos?.includes(tema.id);
                  return (
                    <div
                      key={tema.id}
                      className="relative rounded-2xl border-2 overflow-hidden cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        borderColor: rascunho.corPrimaria === tema.config.corPrimaria ? rascunho.corPrimaria : corBorda,
                        background: tema.config.corFundo,
                      }}
                      onClick={() => aplicarTema(tema)}
                    >
                      {/* Preview mini */}
                      <div className="p-3">
                        <div
                          className="h-2 rounded-full mb-1.5 w-3/4"
                          style={{ background: tema.config.corPrimaria }}
                        />
                        <div
                          className="h-1.5 rounded-full mb-1 w-full opacity-30"
                          style={{ background: tema.config.corTexto }}
                        />
                        <div
                          className="h-1.5 rounded-full w-2/3 opacity-20"
                          style={{ background: tema.config.corTexto }}
                        />
                      </div>
                      <div
                        className="px-3 pb-2 flex items-center justify-between"
                        style={{ background: tema.config.corFundo }}
                      >
                        <span className="text-xs font-bold" style={{ color: tema.config.corTexto }}>
                          {tema.emoji} {tema.nome}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); favoritarTema(tema.id); }}
                          className="p-0.5"
                        >
                          <Heart
                            size={12}
                            style={{ color: isFav ? '#ef4444' : tema.config.corTexto + '40' }}
                            className={isFav ? 'fill-current' : ''}
                          />
                        </button>
                      </div>
                      {rascunho.corPrimaria === tema.config.corPrimaria && (
                        <div
                          className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: rascunho.corPrimaria }}
                        >
                          <Check size={9} color="#fff" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Modo automático */}
              <div
                className="flex items-center justify-between p-3 rounded-2xl border"
                style={{ borderColor: corBorda, background: corCard }}
              >
                <div className="flex items-center gap-2">
                  <Moon size={16} style={{ color: rascunho.corPrimaria }} />
                  <div>
                    <p className="text-xs font-bold" style={{ color: rascunho.corTexto }}>Modo automático</p>
                    <p className="text-[10px]" style={{ color: corTextoSec }}>Escuro após 20h</p>
                  </div>
                </div>
                <Toggle
                  value={rascunho.modoAutomatico}
                  onChange={(v) => atualizar('modoAutomatico', v)}
                  cor={rascunho.corPrimaria}
                />
              </div>
            </div>
          )}

          {/* ── CORES ── */}
          {abaSelecionada === 'cores' && (
            <div className="space-y-4">
              <div
                className="flex items-center gap-2 p-3 rounded-2xl border"
                style={{ borderColor: corBorda, background: corCard }}
              >
                <Sun size={16} style={{ color: rascunho.corPrimaria }} />
                <span className="text-xs font-bold flex-1" style={{ color: rascunho.corTexto }}>Tema base</span>
                <div className="flex gap-1">
                  {['claro', 'escuro'].map(t => (
                    <button
                      key={t}
                      onClick={() => atualizar('tema', t)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                      style={rascunho.tema === t
                        ? { background: rascunho.corPrimaria, color: '#fff' }
                        : { background: corBorda, color: corTextoSec }
                      }
                    >
                      {t === 'claro' ? '☀️ Claro' : '🌙 Escuro'}
                    </button>
                  ))}
                </div>
              </div>

              {[
                { campo: 'corPrimaria',   label: 'Cor principal',   desc: 'Botões e destaques' },
                { campo: 'corSecundaria', label: 'Cor secundária',  desc: 'Hover e gradientes' },
                { campo: 'corFundo',      label: 'Fundo da página', desc: 'Background geral' },
                { campo: 'corTexto',      label: 'Texto principal', desc: 'Títulos e parágrafos' },
                { campo: 'corDestaque',   label: 'Destaque',        desc: 'Tags e badges' },
              ].map(({ campo, label, desc }) => (
                <div
                  key={campo}
                  className="flex items-center justify-between p-3 rounded-2xl border"
                  style={{ borderColor: corBorda, background: corCard }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-xl border-2 shadow-sm cursor-pointer relative overflow-hidden"
                      style={{ borderColor: corBorda, background: rascunho[campo] }}
                    >
                      <input
                        type="color"
                        value={rascunho[campo]}
                        onChange={(e) => atualizar(campo, e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: rascunho.corTexto }}>{label}</p>
                      <p className="text-[10px]" style={{ color: corTextoSec }}>{desc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: corTextoSec }}>
                    {rascunho[campo]}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ── TIPOGRAFIA ── */}
          {abaSelecionada === 'tipografia' && (
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: corTextoSec }}>
                Tamanho da fonte
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'compacto',   label: 'Compacto',   size: 'text-xs' },
                  { id: 'padrao',     label: 'Padrão',     size: 'text-sm' },
                  { id: 'acessivel',  label: 'Acessível',  size: 'text-base' },
                ].map(({ id, label, size }) => (
                  <button
                    key={id}
                    onClick={() => atualizar('tamanhoFonte', id)}
                    className={`p-3 rounded-2xl border-2 text-center transition-all ${size}`}
                    style={rascunho.tamanhoFonte === id
                      ? { borderColor: rascunho.corPrimaria, background: rascunho.corPrimaria + '15', color: rascunho.corPrimaria, fontWeight: 700 }
                      : { borderColor: corBorda, background: corCard, color: corTextoSec }
                    }
                  >
                    Aa<br />
                    <span className="text-[10px] font-bold">{label}</span>
                  </button>
                ))}
              </div>

              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: corTextoSec }}>
                Família de fonte
              </p>
              <div className="space-y-2">
                {FONTES.map(({ id, nome }) => (
                  <button
                    key={id}
                    onClick={() => atualizar('fonteFamilia', id)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all"
                    style={rascunho.fonteFamilia === id
                      ? { borderColor: rascunho.corPrimaria, background: rascunho.corPrimaria + '10' }
                      : { borderColor: corBorda, background: corCard }
                    }
                  >
                    <span
                      className="text-sm font-bold"
                      style={{ color: rascunho.fonteFamilia === id ? rascunho.corPrimaria : rascunho.corTexto }}
                    >
                      {nome}
                    </span>
                    {rascunho.fonteFamilia === id && (
                      <Check size={14} style={{ color: rascunho.corPrimaria }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── LAYOUT ── */}
          {abaSelecionada === 'layout' && (
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: corTextoSec }}>
                Modo de exibição
              </p>
              <div className="space-y-2">
                {LAYOUTS.map(({ id, nome, desc, icon }) => (
                  <button
                    key={id}
                    onClick={() => atualizar('layout', id)}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left"
                    style={rascunho.layout === id
                      ? { borderColor: rascunho.corPrimaria, background: rascunho.corPrimaria + '10' }
                      : { borderColor: corBorda, background: corCard }
                    }
                  >
                    <span className="text-2xl">{icon}</span>
                    <div className="flex-1">
                      <p
                        className="text-sm font-bold"
                        style={{ color: rascunho.layout === id ? rascunho.corPrimaria : rascunho.corTexto }}
                      >
                        {nome}
                      </p>
                      <p className="text-xs" style={{ color: corTextoSec }}>{desc}</p>
                    </div>
                    {rascunho.layout === id && (
                      <Check size={16} style={{ color: rascunho.corPrimaria }} />
                    )}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <ToggleRow
                  icon={<Target size={15} />}
                  label="Modo Foco"
                  desc="Só os 5 mais recentes, sem distrações"
                  value={rascunho.modeFoco}
                  onChange={(v) => atualizar('modeFoco', v)}
                  cor={rascunho.corPrimaria}
                  corCard={corCard}
                  corBorda={corBorda}
                  corTexto={rascunho.corTexto}
                  corTextoSec={corTextoSec}
                />
                <ToggleRow
                  icon={<Monitor size={15} />}
                  label="Modo Produtividade"
                  desc="Métricas rápidas no topo"
                  value={rascunho.modeProdutividade}
                  onChange={(v) => atualizar('modeProdutividade', v)}
                  cor={rascunho.corPrimaria}
                  corCard={corCard}
                  corBorda={corBorda}
                  corTexto={rascunho.corTexto}
                  corTextoSec={corTextoSec}
                />
              </div>
            </div>
          )}

          {/* ── FUNDO ── */}
          {abaSelecionada === 'fundo' && (
            <div className="space-y-4">
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed transition-all"
                style={{ borderColor: rascunho.corPrimaria + '60', color: rascunho.corPrimaria }}
              >
                <Upload size={18} />
                <span className="text-sm font-bold">
                  {rascunho.imagemFundo ? 'Trocar imagem de fundo' : 'Carregar imagem de fundo'}
                </span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagemFundo} />

              {rascunho.imagemFundo && (
                <>
                  <div
                    className="w-full h-24 rounded-2xl bg-cover bg-center border"
                    style={{ backgroundImage: `url(${rascunho.imagemFundo})`, borderColor: corBorda }}
                  />
                  <SliderRow
                    label="Opacidade da imagem"
                    value={rascunho.imagemFundoOpacidade}
                    min={0} max={0.5} step={0.01}
                    onChange={(v) => atualizar('imagemFundoOpacidade', parseFloat(v))}
                    cor={rascunho.corPrimaria}
                    corTexto={rascunho.corTexto}
                    corTextoSec={corTextoSec}
                    display={`${Math.round(rascunho.imagemFundoOpacidade * 100)}%`}
                  />
                  <SliderRow
                    label="Desfoque (blur)"
                    value={rascunho.imagemFundoBlur}
                    min={0} max={20} step={1}
                    onChange={(v) => atualizar('imagemFundoBlur', parseInt(v))}
                    cor={rascunho.corPrimaria}
                    corTexto={rascunho.corTexto}
                    corTextoSec={corTextoSec}
                    display={`${rascunho.imagemFundoBlur}px`}
                  />
                  <button
                    onClick={() => atualizar('imagemFundo', '')}
                    className="w-full py-2 rounded-xl text-xs font-bold text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
                  >
                    Remover imagem
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── EFEITOS ── */}
          {abaSelecionada === 'efeitos' && (
            <div className="space-y-2">
              <ToggleRow
                icon={<Zap size={15} />}
                label="Animações"
                desc="Transições e micro-interações"
                value={rascunho.animacoes}
                onChange={(v) => atualizar('animacoes', v)}
                cor={rascunho.corPrimaria}
                corCard={corCard}
                corBorda={corBorda}
                corTexto={rascunho.corTexto}
                corTextoSec={corTextoSec}
              />
              <ToggleRow
                icon={<Minimize2 size={15} />}
                label="Modo Minimalista"
                desc="Remove sombras e bordas decorativas"
                value={rascunho.minimalista}
                onChange={(v) => atualizar('minimalista', v)}
                cor={rascunho.corPrimaria}
                corCard={corCard}
                corBorda={corBorda}
                corTexto={rascunho.corTexto}
                corTextoSec={corTextoSec}
              />
              <ToggleRow
                icon={<Eye size={15} />}
                label="Alto contraste"
                desc="Melhora acessibilidade visual"
                value={rascunho.altoContraste}
                onChange={(v) => atualizar('altoContraste', v)}
                cor={rascunho.corPrimaria}
                corCard={corCard}
                corBorda={corBorda}
                corTexto={rascunho.corTexto}
                corTextoSec={corTextoSec}
              />
            </div>
          )}

          {/* ── PERFIS ── */}
          {abaSelecionada === 'perfis' && (
            <div className="space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: corTextoSec }}>
                Perfis de uso
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PERFIS_PREDEFINIDOS.map(({ id, nome, emoji }) => {
                  const temPerfil = !!rascunho.perfis?.[id];
                  return (
                    <div
                      key={id}
                      className="rounded-2xl border-2 p-3 text-center"
                      style={{ borderColor: corBorda, background: corCard }}
                    >
                      <div className="text-2xl mb-1">{emoji}</div>
                      <p className="text-xs font-bold mb-2" style={{ color: rascunho.corTexto }}>{nome}</p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => salvarPerfil(id)}
                          className="flex-1 py-1 rounded-lg text-[10px] font-bold transition-all"
                          style={{ background: rascunho.corPrimaria + '20', color: rascunho.corPrimaria }}
                        >
                          Salvar
                        </button>
                        {temPerfil && (
                          <button
                            onClick={() => carregarPerfil(id)}
                            className="flex-1 py-1 rounded-lg text-[10px] font-bold transition-all"
                            style={{ background: rascunho.corPrimaria, color: '#fff' }}
                          >
                            Usar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {rascunho.temasFavoritos?.length > 0 && (
                <>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: corTextoSec }}>
                    Temas favoritos
                  </p>
                  <div className="space-y-2">
                    {TEMAS_PREDEFINIDOS.filter(t => rascunho.temasFavoritos.includes(t.id)).map(tema => (
                      <button
                        key={tema.id}
                        onClick={() => aplicarTema(tema)}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl border transition-all text-left"
                        style={{ borderColor: corBorda, background: corCard }}
                      >
                        <span className="text-xl">{tema.emoji}</span>
                        <span className="text-sm font-bold flex-1" style={{ color: rascunho.corTexto }}>{tema.nome}</span>
                        <ChevronRight size={14} style={{ color: corTextoSec }} />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div
          className="px-4 py-3 border-t flex gap-2 shrink-0"
          style={{ borderColor: corBorda, background: corCard }}
        >
          <button
            onClick={resetar}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            style={{ borderColor: corBorda, color: corTextoSec }}
          >
            <RotateCcw size={13} /> Reset
          </button>
          <button
            onClick={salvar}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
            style={{ background: rascunho.corPrimaria, color: '#fff' }}
          >
            <Save size={15} />
            Salvar e fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-componentes ───────────────────────────────────────────────────────────

function Toggle({ value, onChange, cor }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative w-10 h-5 rounded-full transition-all shrink-0"
      style={{ background: value ? cor : '#cbd5e1' }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
        style={{ left: value ? '1.25rem' : '0.125rem' }}
      />
    </button>
  );
}

function ToggleRow({ icon, label, desc, value, onChange, cor, corCard, corBorda, corTexto, corTextoSec }) {
  return (
    <div
      className="flex items-center justify-between p-3 rounded-2xl border"
      style={{ borderColor: corBorda, background: corCard }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: cor }}>{icon}</span>
        <div>
          <p className="text-xs font-bold" style={{ color: corTexto }}>{label}</p>
          <p className="text-[10px]" style={{ color: corTextoSec }}>{desc}</p>
        </div>
      </div>
      <Toggle value={value} onChange={onChange} cor={cor} />
    </div>
  );
}

function SliderRow({ label, value, min, max, step, onChange, cor, corTexto, corTextoSec, display }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-xs font-bold" style={{ color: corTexto }}>{label}</span>
        <span className="text-xs font-mono" style={{ color: corTextoSec }}>{display}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: cor }}
      />
    </div>
  );
}
