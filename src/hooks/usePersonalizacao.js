import { useState, useEffect, useCallback } from 'react';

// ─── PADRÃO ────────────────────────────────────────────────────────────────────
export const PADRAO = {
  tema: 'claro',
  corPrimaria: '#00A859',
  corSecundaria: '#008C4A',
  corFundo: '#F8FAFC',
  corTexto: '#0f172a',
  corDestaque: '#00A859',
  tamanhoFonte: 'padrao',
  layout: 'cards',
  animacoes: true,
  minimalista: false,
  modeFoco: false,
  imagemFundo: '',
  imagemFundoBlur: 4,
  imagemFundoOpacidade: 0.08,
  fonteFamilia: 'inter',
  perfilAtivo: 'padrao',
  perfis: {},
  temasFavoritos: [],
};

// ─── TEMAS PRÉ-DEFINIDOS ───────────────────────────────────────────────────────
export const TEMAS_PREDEFINIDOS = [
  {
    id: 'corporativo', nome: 'Corporativo', emoji: '🏢',
    config: { tema: 'claro', corPrimaria: '#00A859', corSecundaria: '#008C4A', corFundo: '#F8FAFC', corTexto: '#0f172a', corDestaque: '#00A859', fonteFamilia: 'inter', animacoes: true, minimalista: false },
  },
  {
    id: 'escuro', nome: 'Escuro', emoji: '🌙',
    config: { tema: 'escuro', corPrimaria: '#10b981', corSecundaria: '#059669', corFundo: '#0f172a', corTexto: '#f1f5f9', corDestaque: '#10b981', fonteFamilia: 'inter', animacoes: true, minimalista: false },
  },
  {
    id: 'moderno', nome: 'Moderno', emoji: '✨',
    config: { tema: 'claro', corPrimaria: '#6366f1', corSecundaria: '#4f46e5', corFundo: '#fafafa', corTexto: '#1e1b4b', corDestaque: '#8b5cf6', fonteFamilia: 'poppins', animacoes: true, minimalista: false },
  },
  {
    id: 'neon', nome: 'Neon', emoji: '⚡',
    config: { tema: 'escuro', corPrimaria: '#22d3ee', corSecundaria: '#06b6d4', corFundo: '#020617', corTexto: '#e2e8f0', corDestaque: '#f0abfc', fonteFamilia: 'inter', animacoes: true, minimalista: false },
  },
  {
    id: 'minimalista', nome: 'Minimalista', emoji: '◻️',
    config: { tema: 'claro', corPrimaria: '#64748b', corSecundaria: '#475569', corFundo: '#ffffff', corTexto: '#1e293b', corDestaque: '#64748b', fonteFamilia: 'inter', animacoes: false, minimalista: true },
  },
  {
    id: 'noturno', nome: 'Noturno', emoji: '🌃',
    config: { tema: 'escuro', corPrimaria: '#f59e0b', corSecundaria: '#d97706', corFundo: '#1c1917', corTexto: '#fef3c7', corDestaque: '#fbbf24', fonteFamilia: 'inter', animacoes: true, minimalista: false },
  },
  {
    id: 'concentracao', nome: 'Alta Concentração', emoji: '🎯',
    config: { tema: 'escuro', corPrimaria: '#3b82f6', corSecundaria: '#2563eb', corFundo: '#0c1445', corTexto: '#dbeafe', corDestaque: '#60a5fa', fonteFamilia: 'inter', animacoes: false, minimalista: true },
  },
  {
    id: 'natureza', nome: 'Natureza', emoji: '🌿',
    config: { tema: 'claro', corPrimaria: '#16a34a', corSecundaria: '#15803d', corFundo: '#f0fdf4', corTexto: '#14532d', corDestaque: '#22c55e', fonteFamilia: 'poppins', animacoes: true, minimalista: false },
  },
];

// ─── PERFIS PRÉ-DEFINIDOS ──────────────────────────────────────────────────────
export const PERFIS_PREDEFINIDOS = [
  { id: 'padrao',       nome: 'Padrão',           emoji: '🏠' },
  { id: 'trabalho',     nome: 'Trabalho',          emoji: '💼' },
  { id: 'noturno',      nome: 'Noturno',           emoji: '🌙' },
  { id: 'concentracao', nome: 'Alta Concentração', emoji: '🎯' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const c = (hex || '#F8FAFC').replace('#', '');
  return `${parseInt(c.slice(0,2),16)},${parseInt(c.slice(2,4),16)},${parseInt(c.slice(4,6),16)}`;
}

function gerarEstilo(cfg, imagemFundoPadrao) {
  const fontMap = {
    inter:   'inherit',
    poppins: "'Poppins', sans-serif",
    roboto:  "'Roboto', sans-serif",
    mono:    "'Courier New', monospace",
  };
  const fontSizeMap = { compacto: '13px', padrao: '15px', acessivel: '17px' };
  const rgb      = hexToRgb(cfg.corFundo);
  const opac     = 1 - (cfg.imagemFundoOpacidade ?? 0.08);
  const imgUrl   = cfg.imagemFundo || imagemFundoPadrao;

  return {
    '--cor-primaria':    cfg.corPrimaria,
    '--cor-secundaria':  cfg.corSecundaria,
    '--cor-fundo':       cfg.corFundo,
    '--cor-texto':       cfg.corTexto,
    '--cor-destaque':    cfg.corDestaque,
    backgroundColor:    cfg.corFundo,
    color:              cfg.corTexto,
    fontFamily:         fontMap[cfg.fonteFamilia] ?? 'inherit',
    fontSize:           fontSizeMap[cfg.tamanhoFonte] ?? '15px',
    backgroundImage:    `linear-gradient(rgba(${rgb},${opac}),rgba(${rgb},${opac})),url(${imgUrl})`,
    backgroundSize:     'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  };
}

/**
 * Retorna a chave do localStorage para este usuário + dashboard.
 * Cada usuário tem sua própria chave → personalizações isoladas.
 */
function getStorageKey(dashboardId) {
  const usuarioId = (localStorage.getItem('usuario_id') || 'anonimo')
    .replace(/['"]/g, '').trim();
  return `personalizacao_${usuarioId}_${dashboardId}`;
}

function carregarDoStorage(storageKey) {
  try {
    const salvo = localStorage.getItem(storageKey);
    if (salvo) return { ...PADRAO, ...JSON.parse(salvo) };
  } catch { /* ignore */ }
  return { ...PADRAO };
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────
export function usePersonalizacao(dashboardId = 'atendente') {
  // A chave é calculada na inicialização (usuário já está logado neste ponto)
  const [storageKey] = useState(() => getStorageKey(dashboardId));

  const [rascunho, setRascunho] = useState(() => carregarDoStorage(storageKey));
  const [painelAberto,   setPainelAberto]   = useState(false);
  const [abaSelecionada, setAbaSelecionada] = useState('temas');

  // ── AUTO-SAVE: persiste no localStorage a cada mudança no rascunho ──────────
  // Isso garante que ao recarregar a página, o estado é restaurado automaticamente.
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(rascunho));
    } catch { /* quota exceeded ou modo privado */ }
  }, [rascunho, storageKey]);

  // ── Modo automático noturno (só aplica se o usuário não personalizou) ───────
  useEffect(() => {
    const hora = new Date().getHours();
    const deveEscuro = hora >= 20 || hora < 6;
    const jaPersonalizou = localStorage.getItem(`${storageKey}_manual`);
    if (deveEscuro && rascunho.tema === 'claro' && !jaPersonalizou) {
      const temaNoturno = TEMAS_PREDEFINIDOS.find(t => t.id === 'noturno');
      if (temaNoturno) {
        setRascunho(prev => ({ ...prev, ...temaNoturno.config }));
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Ações ──────────────────────────────────────────────────────────────────

  const atualizar = useCallback((campo, valor) => {
    setRascunho(prev => ({ ...prev, [campo]: valor }));
  }, []);

  const aplicarTema = useCallback((tema) => {
    setRascunho(prev => ({ ...prev, ...tema.config }));
    // Marca que o usuário personalizou manualmente
    localStorage.setItem(`${storageKey}_manual`, '1');
  }, [storageKey]);

  // "Salvar" agora apenas fecha o painel e marca como manual
  // (o auto-save já persistiu tudo)
  const salvar = useCallback(() => {
    localStorage.setItem(`${storageKey}_manual`, '1');
    setPainelAberto(false);
  }, [storageKey]);

  const resetar = useCallback(() => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(`${storageKey}_manual`);
    setRascunho({ ...PADRAO });
  }, [storageKey]);

  const salvarPerfil = useCallback((nomePerfil) => {
    setRascunho(prev => ({
      ...prev,
      perfis: { ...(prev.perfis || {}), [nomePerfil]: { ...prev } },
    }));
  }, []);

  const carregarPerfil = useCallback((nomePerfil) => {
    setRascunho(prev => {
      const perfil = prev.perfis?.[nomePerfil];
      if (!perfil) return prev;
      return { ...prev, ...perfil, perfis: prev.perfis };
    });
  }, []);

  const favoritarTema = useCallback((temaId) => {
    setRascunho(prev => {
      const favs = prev.temasFavoritos || [];
      return {
        ...prev,
        temasFavoritos: favs.includes(temaId)
          ? favs.filter(f => f !== temaId)
          : [...favs, temaId],
      };
    });
  }, []);

  // Usa rascunho para preview em tempo real
  const getEstilo = useCallback(
    (imagemFundoPadrao) => gerarEstilo(rascunho, imagemFundoPadrao),
    [rascunho]
  );

  const classeAnimacao    = rascunho.animacoes   ? '' : '[&_*]:!transition-none [&_*]:!animate-none';
  const classeMinimalista = rascunho.minimalista ? 'minimalista' : '';
  const classeTema        = rascunho.tema === 'escuro' ? 'tema-escuro' : '';

  return {
    rascunho,
    painelAberto,   setPainelAberto,
    abaSelecionada, setAbaSelecionada,
    atualizar,
    aplicarTema,
    salvar,
    resetar,
    salvarPerfil,
    carregarPerfil,
    favoritarTema,
    getEstilo,
    classeAnimacao,
    classeMinimalista,
    classeTema,
  };
}
