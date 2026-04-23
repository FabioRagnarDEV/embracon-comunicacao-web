import { useState, useEffect, useCallback, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import { 
  Search, Tag, FileText, Calendar, Paperclip, X, BookOpen, 
  MessageSquare, Users, Plus, Copy, Lock, Globe, Trash2, Edit2, CheckCircle2, AlertCircle, Download, LogOut, Heart, Bell, HelpCircle, Palette
} from 'lucide-react';
import 'react-quill-new/dist/quill.snow.css';
import { comunicadosService, scriptsService, notificacoesService } from '../services/api';
import backgroundImage from '../assets/atendenteDash.png';
import { usePersonalizacao } from '../hooks/usePersonalizacao';
import PainelPersonalizacao from '../components/PainelPersonalizacao';
import LayoutComunicados from '../components/LayoutComunicados';

// Registrar fontes personalizadas no Quill
const Font = ReactQuill.Quill.import('formats/font');
Font.whitelist = [
  'sans-serif', 
  'serif', 
  'monospace',
  'arial',
  'georgia',
  'impact',
  'tahoma',
  'times-new-roman',
  'verdana',
  'roboto',
  'open-sans',
  'lato',
  'montserrat',
  'poppins',
  'raleway',
  'ubuntu'
];
ReactQuill.Quill.register(Font, true);

const modulosQuillSimples = {
  toolbar: [
    [{ 'font': [
      'sans-serif',
      'serif', 
      'monospace',
      'arial',
      'georgia',
      'impact',
      'tahoma',
      'times-new-roman',
      'verdana',
      'roboto',
      'open-sans',
      'lato',
      'montserrat',
      'poppins',
      'raleway',
      'ubuntu'
    ] }],
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link'], 
    ['clean']
  ]
};

export default function DashboardAtendente() {
  const personalizacao = usePersonalizacao('atendente');
  const { rascunho, painelAberto, setPainelAberto, getEstilo, classeAnimacao, classeMinimalista, classeTema } = personalizacao;

  const [abaAtiva, setAbaAtiva] = useState('comunicados');
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [carregando, setCarregando] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  
  const [listaComunicados, setListaComunicados] = useState([]);
  const [publicacaoVisualizada, setPublicacaoVisualizada] = useState(null);

  const [listaScripts, setListaScripts] = useState([]);
  const [scriptVisualizado, setScriptVisualizado] = useState(null);
  
  const [formScriptAberto, setFormScriptAberto] = useState(false);
  const [idEmEdicaoScript, setIdEmEdicaoScript] = useState(null);
  const [tituloScript, setTituloScript] = useState('');
  const [conteudoScript, setConteudoScript] = useState('');
  const [compartilharScript, setCompartilharScript] = useState(false);
  const [arquivosScript, setArquivosScript] = useState(null);
  
  // 🔔 ESTADOS DO SININHO E SOM
  const [notificacoes, setNotificacoes] = useState([]);
  const [painelNotificacoesAberto, setPainelNotificacoesAberto] = useState(false);
  const totalNaoLidasAnterior = useRef(0);
  const primeiraCarga = useRef(true);

  const fileInputRef = useRef(null);
  
  const usuarioIdRaw = localStorage.getItem('usuario_id') || '';
  const usuarioId = usuarioIdRaw.replace(/['"]/g, '').trim();

  const [modalLogoutAberto, setModalLogoutAberto] = useState(false);
  const [despedindo, setDespedindo] = useState(false);

  // Estados para modal de boas-vindas
  const [modalBoasVindas, setModalBoasVindas] = useState(false);
  const [etapaBoasVindas, setEtapaBoasVindas] = useState('pergunta'); // 'pergunta' ou 'saudacao'
  const [nomePreferido, setNomePreferido] = useState('');
  const [tratamento, setTratamento] = useState(''); // 'masculino' ou 'feminino'

  // Estado para modal de instruções
  const [modalInstrucoes, setModalInstrucoes] = useState(false);

  // Verificar se é o primeiro acesso (apenas uma vez)
  useEffect(() => {
    const jaConfigurou = localStorage.getItem('usuario_configurado');
    
    if (!jaConfigurou) {
      setModalBoasVindas(true);
      setEtapaBoasVindas('pergunta');
    } else {
      // Carregar dados salvos
      setNomePreferido(localStorage.getItem('nome_preferido') || '');
      setTratamento(localStorage.getItem('tratamento') || '');
    }
  }, []);

  // Função para obter saudação baseada no horário
  const obterSaudacao = () => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return 'Bom dia';
    if (hora >= 12 && hora < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Função para confirmar nome e tratamento
  const confirmarNome = () => {
    if (!nomePreferido.trim() || !tratamento) {
      mostrarMensagem('Por favor, preencha seu nome e selecione como prefere ser tratado(a)', 'erro');
      return;
    }
    
    // Salvar preferências (apenas uma vez)
    localStorage.setItem('nome_preferido', nomePreferido);
    localStorage.setItem('tratamento', tratamento);
    localStorage.setItem('usuario_configurado', 'true');
    
    setEtapaBoasVindas('saudacao');
  };

  // Função para fechar modal de boas-vindas
  const fecharBoasVindas = () => {
    setModalBoasVindas(false);
    setEtapaBoasVindas('pergunta');
    setNomePreferido('');
    setTratamento('');
  };

  const mostrarMensagem = (texto, tipo = 'sucesso') => {
    setMensagem({ texto, tipo });
    setTimeout(() => setMensagem({ texto: '', tipo: '' }), 5000);
  };

  const confirmarLogout = () => {
    setDespedindo(true);
    setTimeout(() => {
      localStorage.clear();
      window.location.href = '/'; 
    }, 1500);
  };

  const decodificarHTML = (html) => {
    if (!html) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  // ==========================================================
  // BUSCAS NA API
  // ==========================================================
  const buscarComunicados = useCallback(async () => {
    try {
      const data = await comunicadosService.listar();
      setListaComunicados(data);
    } catch (error) { 
      console.error('Erro na busca de comunicados:', error.message);
    }
  }, []);

  const buscarScripts = useCallback(async () => {
    try {
      const data = await scriptsService.listar();
      setListaScripts(data || []);
    } catch (error) { 
      console.error('Erro ao buscar scripts:', error.message);
    }
  }, []);

  const buscarNotificacoes = useCallback(async () => {
    try {
      const data = await notificacoesService.listar();
      setNotificacoes(data);
    } catch (error) { 
      console.error('Erro ao buscar notificações:', error.message);
    }
  }, []);

  // Efeito Inicial e Radar de Atualização Otimizado
  useEffect(() => {
    setCarregando(true);
    Promise.all([buscarComunicados(), buscarScripts(), buscarNotificacoes()]).finally(() => setCarregando(false));

    // Radar atualiza a cada 30 segundos (otimizado)
    const radar = setInterval(() => {
      // Só atualiza se a aba estiver ativa
      if (!document.hidden) {
        buscarNotificacoes();
        buscarComunicados(); 
      }
    }, 30000); // 30 segundos

    // Atualizar quando o usuário voltar para a aba
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        buscarNotificacoes();
        buscarComunicados();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(radar);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [buscarComunicados, buscarScripts, buscarNotificacoes]);

  // ==========================================================
  // EFEITO SONORO DE NOTIFICAÇÃO (CORRIGIDO)
  // ==========================================================
  useEffect(() => {
    const naoLidasAtuais = notificacoes.filter(n => !n.lida).length;

    if (!primeiraCarga.current && naoLidasAtuais > totalNaoLidasAnterior.current) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5; 
      audio.play().catch(() => console.log('O navegador bloqueou o áudio porque o usuário ainda não clicou na tela.'));
    }

    totalNaoLidasAnterior.current = naoLidasAtuais;
    
    // Destrava SEMPRE após a primeira verificação, mesmo que tenha 0 avisos
    primeiraCarga.current = false;
  }, [notificacoes]);

  // ==========================================================
  // LÓGICA DE NEGÓCIO E CLIQUES
  // ==========================================================
  const registrarLeitura = async (comunicado) => {
    setPublicacaoVisualizada(comunicado); 
    try {
      await comunicadosService.registrarLeitura(comunicado.id);
    } catch (error) { 
      console.log("Rastreio falhou:", error.message); 
    }
  };

  const toggleCurtida = async (comunicadoId, e) => {
    e.stopPropagation(); 
    setListaComunicados(prev => prev.map(c => {
      if (c.id === comunicadoId) {
        const jaCurtiu = c.curtidas_comunicados?.some(curtida => curtida.usuario_id === usuarioId);
        let novasCurtidas = [...(c.curtidas_comunicados || [])];
        if (jaCurtiu) novasCurtidas = novasCurtidas.filter(curtida => curtida.usuario_id !== usuarioId);
        else novasCurtidas.push({ usuario_id: usuarioId });
        return { ...c, curtidas_comunicados: novasCurtidas };
      }
      return c;
    }));

    try {
      await comunicadosService.curtir(comunicadoId);
    } catch (error) {
      mostrarMensagem(error.message, 'erro');
      buscarComunicados(); 
    }
  };

  const lerNotificacao = async (notificacao, e) => {
    if (e) e.stopPropagation();

    if (!notificacao.lida) {
      setNotificacoes(prev => prev.map(n => n.id === notificacao.id ? { ...n, lida: true } : n));
      notificacoesService.marcarComoLida(notificacao.id).catch(console.error);
    }

    if (notificacao.comunicado_id) {
      const comunicadoAlvo = listaComunicados.find(c => c.id === notificacao.comunicado_id);
      if (comunicadoAlvo) {
        registrarLeitura(comunicadoAlvo); 
        setPainelNotificacoesAberto(false); 
      } else {
        mostrarMensagem("Este comunicado foi excluído ou não está mais disponível.", "erro");
      }
    }
  };

  const abrirParaEdicao = (script, e) => { e.stopPropagation(); setTituloScript(script.titulo); setConteudoScript(decodificarHTML(script.conteudo)); setCompartilharScript(script.visivel_equipe); setIdEmEdicaoScript(script.id); setFormScriptAberto(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const cancelarEdicaoScript = () => { setTituloScript(''); setConteudoScript(''); setCompartilharScript(false); setArquivosScript(null); setIdEmEdicaoScript(null); setFormScriptAberto(false); if (fileInputRef.current) fileInputRef.current.value = ""; };
  
  const salvarScript = async (e) => { 
    e.preventDefault(); 
    if (!tituloScript || !conteudoScript) return mostrarMensagem('Preencha título e conteúdo', 'erro'); 
    
    try { 
      const formData = new FormData(); 
      formData.append('titulo', tituloScript); 
      formData.append('conteudo', conteudoScript); 
      formData.append('visivel_equipe', compartilharScript); 
      
      if (arquivosScript) { 
        Array.from(arquivosScript).forEach(arq => formData.append('arquivos', arq)); 
      } 
      
      if (idEmEdicaoScript) {
        await scriptsService.atualizar(idEmEdicaoScript, formData);
        mostrarMensagem('Script atualizado!');
      } else {
        await scriptsService.criar(formData);
        mostrarMensagem('Script salvo!');
      }
      
      cancelarEdicaoScript(); 
      buscarScripts(); 
    } catch (error) { 
      mostrarMensagem(error.message, 'erro'); 
    } 
  };
  
  const deletarScript = async (id, e) => { 
    e.stopPropagation(); 
    if (!window.confirm("Apagar este script?")) return; 
    
    try { 
      await scriptsService.deletar(id);
      mostrarMensagem('Script apagado.'); 
      buscarScripts(); 
    } catch (error) { 
      mostrarMensagem(error.message, 'erro'); 
    } 
  };
  
  const copiarParaAreaTransferencia = (html, titulo, e) => { if (e) e.stopPropagation(); const el = document.createElement('div'); el.innerHTML = html; navigator.clipboard.writeText(el.innerText || el.textContent).then(() => mostrarMensagem(`"${titulo}" copiado!`, 'sucesso')).catch(() => mostrarMensagem('Falha.', 'erro')); };

  // ==========================================================
  // FILTROS E VARIÁVEIS DE TELA
  // ==========================================================
  const termo = termoBusca.toLowerCase();
  const comunicadosFiltrados = listaComunicados.filter(c => c.titulo.toLowerCase().includes(termo) || c.tags.toLowerCase().includes(termo));
  const meusScripts = listaScripts.filter(s => String(s.autor_id).trim() === usuarioId && s.titulo.toLowerCase().includes(termo));
  const scriptsEquipe = listaScripts.filter(s => String(s.autor_id).trim() !== usuarioId && s.visivel_equipe && s.titulo.toLowerCase().includes(termo));
  
  const naoLidas = notificacoes.filter(n => !n.lida).length;

  // ── Classe de layout aplicada na tela inteira ──────────────────────────────
  const layoutAtual = rascunho.modeFoco ? 'foco' : (rascunho.layout || 'cards');
  const classeLayout = `layout-${layoutAtual}`;

  return (
    <div
      className={`min-h-screen font-sans relative pb-24 ${classeAnimacao} ${classeMinimalista} ${classeTema} ${classeLayout}`}
      onClick={() => setPainelNotificacoesAberto(false)}
      style={{
        ...getEstilo(backgroundImage),
        // Padding varia por layout
        padding: layoutAtual === 'kanban' ? '0' :
                 layoutAtual === 'magazine' ? '0' :
                 layoutAtual === 'compacto' ? '0.75rem' :
                 undefined,
      }}
    >
      {painelAberto && (
        <PainelPersonalizacao
          {...personalizacao}
          onFechar={() => setPainelAberto(false)}
        />
      )}
      
      {mensagem.texto && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 fade-in duration-300 w-[calc(100vw-2rem)] sm:w-auto">
          <div className={`flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-2xl border text-sm sm:text-base ${mensagem.tipo === 'erro' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-800 border-emerald-900 text-white'}`}>
            {mensagem.tipo === 'erro' ? <AlertCircle size={20}/> : <CheckCircle2 size={20}/>}
            <span className="font-bold">{mensagem.texto}</span>
          </div>
        </div>
      )}

      <div className={
        layoutAtual === 'kanban'   ? 'h-screen flex flex-col' :
        layoutAtual === 'magazine' ? 'min-h-screen flex flex-col' :
        layoutAtual === 'compacto' ? 'max-w-3xl xl:max-w-4xl mx-auto space-y-3 p-3 sm:p-4' :
        layoutAtual === 'lista'    ? 'max-w-4xl xl:max-w-5xl mx-auto space-y-4 p-3 sm:p-4 md:p-6 lg:p-8' :
        layoutAtual === 'foco'     ? 'max-w-2xl mx-auto space-y-4 p-3 sm:p-4 md:p-6 lg:p-8' :
        'max-w-5xl xl:max-w-6xl 2xl:max-w-7xl tv:max-w-[100rem] mx-auto space-y-6 lg:space-y-8 tv:space-y-12 p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 tv:p-16'
      }>
        {/* Header adaptativo por layout */}
        {layoutAtual === 'kanban' ? (
          <div className="flex items-center justify-between px-4 py-3 border-b shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl text-white shrink-0" style={{ background: rascunho.corPrimaria }}>
                <BookOpen size={20} />
              </div>
              <div>
                <h1 className="font-extrabold text-sm text-slate-800">
                  {nomePreferido ? `${obterSaudacao()}, ${nomePreferido}!` : 'Portal do Atendente'}
                </h1>
                <p className="text-xs text-slate-500">Kanban de Comunicados</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input type="text" placeholder="Buscar..." value={termoBusca} onChange={e => setTermoBusca(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none w-36 sm:w-48"
                />
              </div>
              <button onClick={() => setPainelAberto(true)} className="p-2 rounded-xl text-white" style={{ background: rascunho.corPrimaria }}>
                <Palette size={14}/>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setPainelNotificacoesAberto(!painelNotificacoesAberto); }} className="relative p-2 rounded-xl bg-slate-100 text-slate-500">
                <Bell size={16}/>
                {naoLidas > 0 && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full"/>}
              </button>
              <button onClick={() => setModalLogoutAberto(true)} className="p-2 rounded-xl bg-red-50 text-red-500">
                <LogOut size={16}/>
              </button>
            </div>
          </div>
        ) : layoutAtual === 'magazine' ? (
          <div className="relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10 shrink-0"
            style={{ background: `linear-gradient(135deg, ${rascunho.corPrimaria}25, ${rascunho.corSecundaria}10)` }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-2xl text-white shadow-lg" style={{ background: rascunho.corPrimaria }}>
                    <BookOpen size={22}/>
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full text-white"
                    style={{ background: rascunho.corPrimaria }}
                  >Portal do Atendente</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold mb-1 text-slate-800">
                  {nomePreferido ? `${obterSaudacao()}, ${nomePreferido}! ${tratamento === 'feminino' ? '👩‍💼' : tratamento === 'masculino' ? '👨‍💼' : ''}` : 'Bem-vindo ao Portal'}
                </h1>
                <p className="text-sm text-slate-500">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15}/>
                  <input type="text" placeholder="Buscar..." value={termoBusca} onChange={e => setTermoBusca(e.target.value)}
                    className="pl-9 pr-3 py-2 text-sm bg-white/80 border border-white/50 rounded-xl outline-none w-48 backdrop-blur-sm"
                  />
                </div>
                <button onClick={() => setPainelAberto(true)} className="px-3 py-2 rounded-xl text-white font-bold flex items-center gap-1.5 text-sm"
                  style={{ background: rascunho.corPrimaria }}
                ><Palette size={15}/> <span className="hidden sm:inline">Personalize</span></button>
                <button onClick={(e) => { e.stopPropagation(); setPainelNotificacoesAberto(!painelNotificacoesAberto); }}
                  className="relative p-2.5 rounded-xl bg-white/80 text-slate-600 backdrop-blur-sm"
                >
                  <Bell size={18}/>
                  {naoLidas > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full">{naoLidas > 9 ? '9+' : naoLidas}</span>}
                </button>
                <button onClick={() => setModalLogoutAberto(true)} className="p-2.5 rounded-xl bg-red-500 text-white">
                  <LogOut size={16}/>
                </button>
              </div>
            </div>
          </div>
        ) : layoutAtual === 'foco' ? (
          <div className="text-center py-6 px-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest text-white mb-3"
              style={{ background: rascunho.corPrimaria }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"/>
              Modo Foco Ativo
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold mb-1 text-slate-800">
              {nomePreferido ? `${obterSaudacao()}, ${nomePreferido}!` : 'Portal do Atendente'}
            </h1>
            <p className="text-sm text-slate-500 mb-4">Apenas os comunicados mais recentes</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                <input type="text" placeholder="Buscar..." value={termoBusca} onChange={e => setTermoBusca(e.target.value)}
                  className="pl-8 pr-3 py-2 text-sm bg-white/80 border border-slate-200 rounded-xl outline-none w-48"
                />
              </div>
              <button onClick={() => setPainelAberto(true)} className="p-2 rounded-xl text-white" style={{ background: rascunho.corPrimaria }}>
                <Palette size={16}/>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setPainelNotificacoesAberto(!painelNotificacoesAberto); }}
                className="relative p-2 rounded-xl bg-white/80 text-slate-500"
              >
                <Bell size={16}/>
                {naoLidas > 0 && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full">{naoLidas}</span>}
              </button>
              <button onClick={() => setModalLogoutAberto(true)} className="p-2 rounded-xl bg-red-50 text-red-500">
                <LogOut size={16}/>
              </button>
            </div>
          </div>
        ) : (
          /* CARDS / LISTA / COMPACTO: header padrão */
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative">
            <div className="flex items-center justify-between w-full md:w-auto gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 sm:p-3 rounded-2xl text-white shadow-lg shrink-0"
                  style={{ background: rascunho.corPrimaria, boxShadow: `0 4px 15px ${rascunho.corPrimaria}30` }}
                >
                  <BookOpen size={24} className="sm:hidden" />
                  <BookOpen size={28} className="hidden sm:block" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-800 flex flex-wrap items-center gap-2">
                    {nomePreferido ? (
                      <>
                        {obterSaudacao()}, {nomePreferido}!
                        {tratamento && <span className="text-xl sm:text-2xl">{tratamento === 'feminino' ? '👩‍💼' : '👨‍💼'}</span>}
                      </>
                    ) : 'Portal do Atendente'}
                  </h1>
                  <p className="text-slate-600 font-medium mt-0.5 text-sm sm:text-base">Aqui é o seu dashboard de Atendimento</p>
                  <p className="text-slate-500 text-xs sm:text-sm hidden sm:block">Você pode visualizar comunicados, criar scripts pessoais e acessar conteúdos da equipe</p>
                </div>
              </div>
              <div className="flex md:hidden items-center gap-2 shrink-0">
                <button onClick={() => setPainelAberto(true)} className="p-2 rounded-xl text-white" style={{ background: rascunho.corPrimaria }}>
                  <Palette size={18} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setPainelNotificacoesAberto(!painelNotificacoesAberto); }} className="relative p-2 text-slate-500 bg-slate-50 rounded-xl">
                  <Bell size={20} />
                  {naoLidas > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"/>}
                </button>
                <button onClick={() => setModalLogoutAberto(true)} className="p-2 text-red-500 bg-red-50 rounded-xl border border-red-100">
                  <LogOut size={20} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto relative">
              <div className="relative w-full md:w-64 lg:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Pesquisa rápida..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm"/>
              </div>
              <div className="hidden md:flex items-center gap-2 lg:gap-3">
                <button onClick={() => setPainelAberto(true)} className="flex items-center gap-2 px-3 lg:px-4 py-2.5 text-white text-sm font-bold rounded-xl shadow-lg active:scale-95 whitespace-nowrap"
                  style={{ background: `linear-gradient(135deg, ${rascunho.corPrimaria}, ${rascunho.corSecundaria})` }}
                >
                  <Palette size={16} /> <span className="hidden lg:inline">Personalize</span>
                </button>
                <button onClick={() => setModalInstrucoes(true)} className="flex items-center gap-2 px-3 lg:px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold rounded-xl shadow-lg active:scale-95 whitespace-nowrap">
                  <HelpCircle size={18} /> <span className="hidden lg:inline">Instruções</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); setPainelNotificacoesAberto(!painelNotificacoesAberto); }} className="relative p-2.5 text-slate-500 bg-slate-50 rounded-xl">
                  <Bell size={20} />
                  {naoLidas > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white">{naoLidas > 9 ? '9+' : naoLidas}</span>}
                </button>
                <button onClick={() => setModalLogoutAberto(true)} className="flex items-center gap-2 px-3 lg:px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold rounded-xl shadow-lg active:scale-95 shrink-0">
                  <LogOut size={18} /> <span className="hidden lg:inline">Sair</span>
                </button>
              </div>
              {painelNotificacoesAberto && (
                <div onClick={(e) => e.stopPropagation()} className="absolute top-full right-0 mt-3 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center">
                    <h4 className="font-extrabold text-slate-800 flex items-center gap-2"><Bell size={16} className="text-slate-400"/> Notificações</h4>
                    {naoLidas > 0 && <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-1 rounded-lg uppercase">{naoLidas} Novas</span>}
                  </div>
                  <div className="max-h-[350px] overflow-y-auto p-2">
                    {notificacoes.length === 0 ? (
                      <div className="text-center py-8 text-slate-400"><Bell size={24} className="mx-auto mb-2 opacity-20"/><p className="text-sm">Nenhum aviso novo.</p></div>
                    ) : (
                      <div className="space-y-1">
                        {notificacoes.map(n => (
                          <div key={n.id} onClick={(e) => lerNotificacao(n, e)} className={`p-4 rounded-2xl cursor-pointer transition-all relative overflow-hidden ${n.lida ? 'hover:bg-slate-50' : 'bg-slate-50'}`}>
                            {!n.lida && <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: rascunho.corPrimaria }}/>}
                            <h5 className={`text-sm mb-1 ${n.lida ? 'font-bold text-slate-600' : 'font-extrabold text-slate-900'}`}>{n.titulo}</h5>
                            <p className={`text-xs ${n.lida ? 'text-slate-400' : 'text-slate-600'}`}>{n.mensagem}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-slate-400 font-bold">{new Date(n.criado_em).toLocaleDateString('pt-BR')}</span>
                              {n.comunicado_id && <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: rascunho.corPrimaria, background: rascunho.corPrimaria + '15' }}>Ler Agora →</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </header>
        )}

        {layoutAtual !== 'foco' && (
          <div className={`flex overflow-x-auto hide-scrollbar gap-1 sm:gap-2 p-1 bg-white/80 backdrop-blur-sm rounded-2xl w-fit max-w-full shadow-lg border border-slate-200 ${layoutAtual === 'kanban' ? 'mx-4 my-2' : ''}`}>
          <button onClick={() => setAbaAtiva('comunicados')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 lg:px-6 tv:px-8 py-2.5 sm:py-3 tv:py-4 rounded-xl font-bold text-xs sm:text-sm tv:text-base transition-all whitespace-nowrap"
            style={abaAtiva === 'comunicados' ? { background: `linear-gradient(135deg, ${rascunho.corPrimaria}, ${rascunho.corSecundaria})`, color: '#fff' } : { color: '#475569' }}
          ><FileText size={16} className="sm:hidden"/><FileText size={18} className="hidden sm:block"/> <span className="hidden xs:inline">Comunicados Oficiais</span><span className="xs:hidden">Comunicados</span></button>
          <button onClick={() => setAbaAtiva('meus_scripts')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 lg:px-6 tv:px-8 py-2.5 sm:py-3 tv:py-4 rounded-xl font-bold text-xs sm:text-sm tv:text-base transition-all whitespace-nowrap"
            style={abaAtiva === 'meus_scripts' ? { background: `linear-gradient(135deg, ${rascunho.corPrimaria}, ${rascunho.corSecundaria})`, color: '#fff' } : { color: '#475569' }}
          ><MessageSquare size={16} className="sm:hidden"/><MessageSquare size={18} className="hidden sm:block"/> <span className="hidden xs:inline">Meus Scripts</span><span className="xs:hidden">Scripts</span></button>
          <button onClick={() => setAbaAtiva('comunidade')}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 lg:px-6 tv:px-8 py-2.5 sm:py-3 tv:py-4 rounded-xl font-bold text-xs sm:text-sm tv:text-base transition-all whitespace-nowrap"
            style={abaAtiva === 'comunidade' ? { background: `linear-gradient(135deg, ${rascunho.corPrimaria}, ${rascunho.corSecundaria})`, color: '#fff' } : { color: '#475569' }}
          ><Users size={16} className="sm:hidden"/><Users size={18} className="hidden sm:block"/> <span className="hidden xs:inline">Scripts da Equipe</span><span className="xs:hidden">Equipe</span></button>
        </div>
        )}

        {carregando ? (
           <div className="text-center py-20"><div className="h-8 w-8 border-4 border-[#00A859]/30 border-t-blue-600 rounded-full animate-spin mx-auto" /></div>
        ) : (
          <div className={`animate-in fade-in slide-in-from-bottom-4 duration-500 ${layoutAtual === 'kanban' ? 'flex-1 overflow-hidden px-4 pb-4' : layoutAtual === 'magazine' ? 'px-6 sm:px-10 pb-10' : ''}`}>

            {abaAtiva === 'comunicados' && (
              <LayoutComunicados
                layout={rascunho.layout}
                modeFoco={rascunho.modeFoco}
                comunicados={comunicadosFiltrados}
                usuarioId={usuarioId}
                onAbrir={registrarLeitura}
                onCurtir={toggleCurtida}
                cor={rascunho.corPrimaria}
              />
            )}

            {abaAtiva === 'meus_scripts' && (
              <div className="space-y-6">
                {!formScriptAberto ? (
                  <button onClick={() => setFormScriptAberto(true)}
                    className="w-full py-6 border-2 border-dashed rounded-3xl font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98] text-slate-600 hover:bg-white hover:shadow-lg"
                    style={{ borderColor: rascunho.corPrimaria + '60' }}
                    onMouseEnter={e => { e.currentTarget.style.color = rascunho.corPrimaria; e.currentTarget.style.borderColor = rascunho.corPrimaria; }}
                    onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = rascunho.corPrimaria + '60'; }}
                  >
                    <Plus size={20}/> Criar Novo Atalho/Script
                  </button>
                ) : (
                  <form onSubmit={salvarScript} className={`bg-white p-6 md:p-8 rounded-3xl shadow-lg border animate-in zoom-in-95 ${idEmEdicaoScript ? 'border-orange-200 ring-2 ring-orange-50' : ''}`}
                    style={!idEmEdicaoScript ? { borderColor: rascunho.corPrimaria + '30' } : {}}
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className={`font-bold text-lg ${idEmEdicaoScript ? 'text-orange-600' : 'text-slate-800'}`}>
                        {idEmEdicaoScript ? 'Editar Script' : 'Novo Script'}
                      </h3>
                      <button type="button" onClick={cancelarEdicaoScript} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
                    </div>
                    <div className="space-y-4">
                      <input type="text" placeholder="Título (ex: Saudação de Bom Dia)" value={tituloScript} onChange={e => setTituloScript(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00A859] outline-none font-bold" required/>
                      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                        <ReactQuill theme="snow" value={conteudoScript} onChange={setConteudoScript} modules={modulosQuillSimples} className="min-h-[150px]"/>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Paperclip size={12}/> Anexar Arquivos Úteis</label>
                          <input ref={fileInputRef} type="file" multiple onChange={(e) => setArquivosScript(e.target.files)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer bg-slate-50 rounded-2xl p-1 border border-dashed border-slate-200" />
                        </div>
                        
                        <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer border border-slate-200 hover:bg-slate-100 transition-colors h-full mt-5">
                          <input type="checkbox" checked={compartilharScript} onChange={e => setCompartilharScript(e.target.checked)} className="w-5 h-5 accent-blue-600 rounded"/>
                          <div className="flex-1">
                            <p className="font-bold text-sm text-slate-800 flex items-center gap-2">Compartilhar com a Equipe {compartilharScript ? <Globe size={16} className="text-[#00A859]"/> : <Lock size={16} className="text-slate-400"/>}</p>
                          </div>
                        </label>
                      </div>

                      <button type="submit"
                        className={`w-full py-4 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] ${idEmEdicaoScript ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-200' : ''}`}
                        style={!idEmEdicaoScript ? { background: `linear-gradient(135deg, ${rascunho.corPrimaria}, ${rascunho.corSecundaria})` } : {}}
                      >
                        {idEmEdicaoScript ? 'Atualizar Script' : 'Guardar Script'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 tv:grid-cols-4 gap-3 sm:gap-4 tv:gap-6">
                  {meusScripts.length === 0 && !formScriptAberto ? <p className="text-slate-400 col-span-full text-center py-10">Nenhum script na sua tela no momento.</p> : 
                    meusScripts.map(script => (
                      <div key={script.id} onClick={() => setScriptVisualizado(script)} className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col h-full shadow-sm hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-extrabold text-slate-800 group-hover:transition-colors" style={{ color: undefined }}
                            onMouseEnter={e => e.currentTarget.style.color = rascunho.corPrimaria}
                            onMouseLeave={e => e.currentTarget.style.color = ''}
                          >{script.titulo}</h4>
                          <span title={script.visivel_equipe ? "Público" : "Privado"}
                            className="p-1.5 rounded-lg"
                            style={script.visivel_equipe ? { background: rascunho.corPrimaria + '15', color: rascunho.corPrimaria } : { background: '#f1f5f9', color: '#94a3b8' }}
                          >
                            {script.visivel_equipe ? <Globe size={14}/> : <Lock size={14}/>}
                          </span>
                        </div>
                        
                        {script.anexos_scripts?.length > 0 && (
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded w-fit mb-3 flex items-center gap-1 font-bold">
                            <Paperclip size={10}/> {script.anexos_scripts.length} anexo(s)
                          </span>
                        )}

                        <div className="flex-1 mb-6 text-sm text-slate-600 line-clamp-2" dangerouslySetInnerHTML={{__html: decodificarHTML(script.conteudo)}} />
                        
                        <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-100">
                          <button onClick={(e) => copiarParaAreaTransferencia(decodificarHTML(script.conteudo), script.titulo, e)}
                            className="flex-1 flex items-center justify-center gap-2 text-white font-bold py-2.5 rounded-xl transition-all active:scale-95"
                            style={{ background: `linear-gradient(135deg, ${rascunho.corPrimaria}, ${rascunho.corSecundaria})` }}
                          >
                            <Copy size={16}/> Copiar
                          </button>
                          <button onClick={(e) => abrirParaEdicao(script, e)} className="p-2.5 bg-orange-50 hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600 text-orange-600 hover:text-white rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-orange-200 active:scale-95">
                            <Edit2 size={16}/>
                          </button>
                          <button onClick={(e) => deletarScript(script.id, e)} className="p-2.5 bg-red-50 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 text-red-500 hover:text-white rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-red-200 active:scale-95">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {abaAtiva === 'comunidade' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 tv:grid-cols-4 gap-3 sm:gap-4 tv:gap-6">
                {scriptsEquipe.length === 0 ? <p className="text-slate-400 col-span-full text-center py-10">A equipe ainda não compartilhou nenhum script.</p> : 
                  scriptsEquipe.map(script => (
                    <div key={script.id} onClick={() => setScriptVisualizado(script)}
                      className="bg-white p-6 rounded-3xl flex flex-col h-full shadow-sm hover:shadow-md transition-all relative overflow-hidden cursor-pointer group border"
                      style={{ borderColor: rascunho.corPrimaria + '30' }}
                    >
                      <div className="absolute top-0 right-0 text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest"
                        style={{ background: rascunho.corPrimaria + '15', color: rascunho.corSecundaria }}
                      >Da Equipe</div>
                      <h4 className="font-extrabold pr-16 mb-1 transition-colors"
                        style={{ color: rascunho.corTexto }}
                        onMouseEnter={e => e.currentTarget.style.color = rascunho.corPrimaria}
                        onMouseLeave={e => e.currentTarget.style.color = rascunho.corTexto}
                      >{script.titulo}</h4>
                      <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">Criado por: <strong className="text-slate-600">{script.usuarios?.nome_completo || 'Desconhecido'}</strong></p>
                      
                      {script.anexos_scripts?.length > 0 && (
                          <span className="text-[10px] px-2 py-1 rounded w-fit mb-3 flex items-center gap-1 font-bold"
                            style={{ background: rascunho.corPrimaria + '10', color: rascunho.corPrimaria }}
                          >
                            <Paperclip size={10}/> {script.anexos_scripts.length} anexo(s)
                          </span>
                      )}

                      <div className="flex-1 mb-6 text-sm text-slate-600 line-clamp-2" dangerouslySetInnerHTML={{__html: decodificarHTML(script.conteudo)}} />
                      
                      <div className="mt-auto pt-4 border-t border-slate-200">
                        <button onClick={(e) => copiarParaAreaTransferencia(decodificarHTML(script.conteudo), script.titulo, e)}
                          className="w-full flex items-center justify-center gap-2 text-white font-bold py-2.5 rounded-xl transition-all active:scale-95"
                          style={{ background: `linear-gradient(135deg, ${rascunho.corPrimaria}, ${rascunho.corSecundaria})` }}
                        >
                          <Copy size={16}/> Copiar Texto
                        </button>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}

          </div>
        )}
      </div>

      {(publicacaoVisualizada || scriptVisualizado) && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-6 tv:p-12 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
          {/* Modal isolado do tema — sempre fundo branco, texto escuro */}
          <div className="rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl tv:max-w-7xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
            style={{ background: '#ffffff', color: '#1e293b' }}
          >
            
            <div className="p-4 sm:p-6 md:p-8 tv:p-12 border-b flex justify-between items-start gap-4 shrink-0"
              style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}
            >
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl md:text-3xl tv:text-4xl font-extrabold leading-tight mb-2 sm:mb-3"
                  style={{ color: '#0f172a' }}
                >
                  {publicacaoVisualizada ? publicacaoVisualizada.titulo : scriptVisualizado.titulo}
                </h2>
                {publicacaoVisualizada && (
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                      <Calendar size={13}/> {new Date(publicacaoVisualizada.criado_em).toLocaleDateString('pt-BR')}
                    </span>
                    {publicacaoVisualizada.modificado_por_usuario ? (
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg flex items-center gap-1">
                        ✏️ Última modificação: {publicacaoVisualizada.modificado_por_usuario.email?.split('@')[0]}
                      </span>
                    ) : publicacaoVisualizada.autor ? (
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1">
                        👤 Publicado por: {publicacaoVisualizada.autor.email?.split('@')[0]}
                      </span>
                    ) : null}
                  </div>
                )}
                {scriptVisualizado && (
                  <button onClick={() => copiarParaAreaTransferencia(decodificarHTML(scriptVisualizado.conteudo), scriptVisualizado.titulo)}
                    className="flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-colors"
                    style={{ background: rascunho.corPrimaria + '15', color: rascunho.corSecundaria }}
                  >
                    <Copy size={16}/> Copiar Texto Inteiro
                  </button>
                )}
              </div>
              <button onClick={() => { setPublicacaoVisualizada(null); setScriptVisualizado(null); }} className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all shrink-0">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 md:p-10 overflow-y-auto modal-leitura"
              style={{ background: '#ffffff', color: '#334155' }}
            >
               <div className="ql-snow">
                  <div className="ql-editor" style={{ color: '#334155', background: '#ffffff' }} dangerouslySetInnerHTML={{ __html: decodificarHTML(publicacaoVisualizada ? publicacaoVisualizada.conteudo : scriptVisualizado.conteudo) }} />
               </div>
            </div>

            {((publicacaoVisualizada?.anexos_comunicados?.length > 0) || (scriptVisualizado?.anexos_scripts?.length > 0)) && (
              <div className="p-6 md:p-8 border-t shrink-0"
                style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}
              >
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2"
                  style={{ color: '#64748b' }}
                >
                  <Paperclip size={14}/> Arquivos em Anexo
                </h4>
                <div className="flex flex-wrap gap-3">
                  {(publicacaoVisualizada ? publicacaoVisualizada.anexos_comunicados : scriptVisualizado.anexos_scripts).map((anexo) => (
                    <a key={anexo.id} href={anexo.url_arquivo} target="_blank" rel="noopener noreferrer"
                      className="group flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-bold transition-all shadow-sm border"
                      style={{ background: '#ffffff', borderColor: '#e2e8f0', color: '#475569' }}
                    >
                      <div className="p-2 rounded-lg group-hover:scale-110 transition-transform"
                        style={{ background: rascunho.corPrimaria + '15', color: rascunho.corPrimaria }}
                      >
                        <Download size={18} />
                      </div>
                      <span className="truncate max-w-[200px] md:max-w-sm">{anexo.nome_arquivo}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL DE BOAS-VINDAS */}
      {modalBoasVindas && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-gradient-to-br from-[#00A859]/80 to-[#008C4A]/80 backdrop-blur-md animate-in fade-in duration-300" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
            
            {etapaBoasVindas === 'pergunta' ? (
              // ETAPA 1: PERGUNTA
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#00A859] to-[#008C4A] rounded-full flex items-center justify-center mb-4 shadow-lg shadow-[#00A859]/20">
                    <Users size={40} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Olá! 👋</h3>
                  <p className="text-slate-600 font-medium">Vamos personalizar sua experiência</p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Como você prefere ser chamado(a)?
                    </label>
                    <input
                      type="text"
                      value={nomePreferido}
                      onChange={(e) => setNomePreferido(e.target.value)}
                      placeholder="Digite seu nome ou apelido"
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-[#00A859]/20 focus:border-[#00A859] outline-none transition-all font-medium"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">
                      Como prefere ser tratado(a)?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setTratamento('masculino')}
                        className={`p-4 rounded-xl border-2 transition-all font-bold ${
                          tratamento === 'masculino'
                            ? 'bg-gradient-to-br from-[#00A859] to-[#008C4A] border-[#00A859] text-white shadow-lg shadow-[#00A859]/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-[#00A859]300 hover:bg-[#00A859]/5'
                        }`}
                      >
                        <div className="text-2xl mb-1">👨</div>
                        <div className="text-sm">Masculino</div>
                      </button>
                      <button
                        onClick={() => setTratamento('feminino')}
                        className={`p-4 rounded-xl border-2 transition-all font-bold ${
                          tratamento === 'feminino'
                            ? 'bg-gradient-to-br from-pink-500 to-pink-600 border-pink-600 text-white shadow-lg shadow-pink-200'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-pink-300 hover:bg-pink-50'
                        }`}
                      >
                        <div className="text-2xl mb-1">👩</div>
                        <div className="text-sm">Feminino</div>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={confirmarNome}
                  disabled={!nomePreferido.trim() || !tratamento}
                  className="w-full mt-6 py-4 bg-gradient-to-r from-[#00A859] to-[#008C4A] hover:from-[#008C4A] hover:to-[#00A859] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#00A859]/20 hover:shadow-xl hover:shadow-[#00A859]/30 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                </button>
              </div>
            ) : (
              // ETAPA 2: SAUDAÇÃO
              <div className="relative overflow-hidden">
                {/* Background decorativo */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00A859] via-[#008C4A] to-[#003D5C] opacity-10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00A859] rounded-full blur-3xl opacity-20 -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#008C4A] rounded-full blur-3xl opacity-20 -ml-32 -mb-32"></div>
                
                <div className="relative p-8 text-center">
                  <div className="mb-6 animate-in zoom-in duration-500">
                    <div className="text-6xl mb-4">
                      {tratamento === 'feminino' ? '👩‍💼' : '👨‍💼'}
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 mb-2">
                      {obterSaudacao()}, {nomePreferido}!
                    </h3>
                    <p className="text-xl font-bold bg-gradient-to-r from-[#00A859] to-[#008C4A] bg-clip-text text-transparent">
                      Seja {tratamento === 'feminino' ? 'bem-vinda' : 'bem-vindo'}! ✨
                    </p>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-200 shadow-lg">
                    <p className="text-slate-700 font-medium leading-relaxed">
                      Estamos felizes em ter você aqui. Que seu dia seja produtivo e cheio de conquistas! 🚀
                    </p>
                  </div>

                  <button
                    onClick={fecharBoasVindas}
                    className="w-full py-4 bg-gradient-to-r from-[#00A859] to-[#008C4A] hover:from-[#008C4A] hover:to-[#00A859] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#00A859]/20 hover:shadow-xl hover:shadow-[#00A859]/30 active:scale-95"
                  >
                    Começar a trabalhar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE INSTRUÇÕES DE USO */}
      {modalInstrucoes && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-6 tv:p-12 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setModalInstrucoes(false)}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl tv:max-w-7xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-[#00A859]/5 flex justify-between items-start gap-4 shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-2xl text-white shadow-lg shadow-emerald-200">
                  <HelpCircle size={32} />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight">
                    Instruções de Uso - Atendente
                  </h2>
                  <p className="text-slate-600 font-medium mt-1">
                    Guia completo de todas as funcionalidades do painel
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModalInstrucoes(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-all shrink-0"
              >
                <X size={24} />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 md:p-8 overflow-y-auto">
              <div className="space-y-8">
                
                {/* Seção 1: Comunicados Oficiais */}
                <div className="bg-gradient-to-br from-[#00A859]/5 to-[#00A859]/10 p-6 rounded-2xl border border-[#00A859]/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-[#00A859] p-2 rounded-xl text-white">
                      <FileText size={24} />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800">1. Comunicados Oficiais</h3>
                  </div>
                  <ul className="space-y-3 text-slate-700">
                    <li className="flex items-start gap-3">
                      <span className="text-[#00A859] font-bold shrink-0">•</span>
                      <span><strong>Visualizar:</strong> Clique em qualquer comunicado para ler o conteúdo completo</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#00A859] font-bold shrink-0">•</span>
                      <span><strong>Curtir:</strong> Clique no botão de coração para curtir comunicados úteis</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#00A859] font-bold shrink-0">•</span>
                      <span><strong>Anexos:</strong> Baixe arquivos anexados (PDFs, planilhas, imagens) clicando nos links</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#00A859] font-bold shrink-0">•</span>
                      <span><strong>Buscar:</strong> Use o campo de busca para encontrar comunicados por título ou tag</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#00A859] font-bold shrink-0">•</span>
                      <span><strong>Rastreamento:</strong> Suas leituras são registradas automaticamente para auditoria</span>
                    </li>
                  </ul>
                </div>

                {/* Seção 2: Meus Scripts */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-600 p-2 rounded-xl text-white">
                      <MessageSquare size={24} />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800">2. Meus Scripts Pessoais</h3>
                  </div>
                  <ul className="space-y-3 text-slate-700">
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold shrink-0">•</span>
                      <span><strong>Criar Script:</strong> Clique em "Criar Novo Atalho/Script" para adicionar respostas rápidas</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold shrink-0">•</span>
                      <span><strong>Título:</strong> Dê um nome descritivo (ex: "Saudação de Bom Dia", "Resposta Cancelamento")</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold shrink-0">•</span>
                      <span><strong>Conteúdo:</strong> Digite ou cole o texto que você usa frequentemente no atendimento</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold shrink-0">•</span>
                      <span><strong>Formatação:</strong> Use negrito, itálico, listas e links para organizar melhor</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold shrink-0">•</span>
                      <span><strong>Anexos:</strong> Adicione arquivos úteis (modelos, imagens, documentos)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold shrink-0">•</span>
                      <span><strong>Privacidade:</strong> Marque "Compartilhar com a Equipe" se quiser que outros vejam</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold shrink-0">•</span>
                      <span><strong>Copiar:</strong> Clique em "Copiar" para copiar o texto e colar no atendimento</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-green-600 font-bold shrink-0">•</span>
                      <span><strong>Editar/Excluir:</strong> Use os botões laranja (editar) e vermelho (excluir) conforme necessário</span>
                    </li>
                  </ul>
                </div>

                {/* Seção 3: Scripts da Equipe */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-600 p-2 rounded-xl text-white">
                      <Users size={24} />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800">3. Scripts da Equipe</h3>
                  </div>
                  <ul className="space-y-3 text-slate-700">
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold shrink-0">•</span>
                      <span><strong>Visualizar:</strong> Veja scripts compartilhados por outros atendentes da equipe</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold shrink-0">•</span>
                      <span><strong>Autor:</strong> Cada script mostra quem criou para você saber a fonte</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold shrink-0">•</span>
                      <span><strong>Copiar:</strong> Clique em "Copiar Texto" para usar o script no seu atendimento</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold shrink-0">•</span>
                      <span><strong>Anexos:</strong> Baixe arquivos compartilhados pelos colegas</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold shrink-0">•</span>
                      <span><strong>Buscar:</strong> Use a busca para encontrar scripts específicos rapidamente</span>
                    </li>
                  </ul>
                </div>

                {/* Seção 4: Notificações */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-orange-600 p-2 rounded-xl text-white">
                      <Bell size={24} />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800">4. Notificações</h3>
                  </div>
                  <ul className="space-y-3 text-slate-700">
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 font-bold shrink-0">•</span>
                      <span><strong>Sininho:</strong> Clique no ícone de sino para ver suas notificações</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 font-bold shrink-0">•</span>
                      <span><strong>Badge Vermelho:</strong> Mostra quantas notificações não lidas você tem</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 font-bold shrink-0">•</span>
                      <span><strong>Som:</strong> Você ouvirá um som quando chegar nova notificação</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 font-bold shrink-0">•</span>
                      <span><strong>Ler:</strong> Clique na notificação para marcar como lida e ir direto ao comunicado</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 font-bold shrink-0">•</span>
                      <span><strong>Atualização:</strong> As notificações são atualizadas automaticamente a cada 30 segundos</span>
                    </li>
                  </ul>
                </div>

                {/* Seção 5: Busca Rápida */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-slate-600 p-2 rounded-xl text-white">
                      <Search size={24} />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800">5. Busca Rápida</h3>
                  </div>
                  <ul className="space-y-3 text-slate-700">
                    <li className="flex items-start gap-3">
                      <span className="text-slate-600 font-bold shrink-0">•</span>
                      <span><strong>Campo Global:</strong> Use o campo de busca no topo para filtrar em qualquer aba</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-slate-600 font-bold shrink-0">•</span>
                      <span><strong>Filtro em Tempo Real:</strong> Os resultados aparecem conforme você digita</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-slate-600 font-bold shrink-0">•</span>
                      <span><strong>Busca Inteligente:</strong> Funciona em títulos, tags e conteúdos</span>
                    </li>
                  </ul>
                </div>

                {/* Dicas Importantes */}
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-2xl border-2 border-yellow-300">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">💡</span>
                    <h3 className="text-xl font-extrabold text-slate-800">Dicas para Melhor Uso</h3>
                  </div>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">✓</span>
                      <span>Crie scripts para respostas que você usa frequentemente - economiza tempo!</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">✓</span>
                      <span>Curta os comunicados úteis para ajudar a monitoria a identificar conteúdo relevante</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">✓</span>
                      <span>Compartilhe seus melhores scripts com a equipe para ajudar os colegas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">✓</span>
                      <span>Verifique as notificações regularmente para não perder comunicados importantes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">✓</span>
                      <span>Use a busca para encontrar informações rapidamente durante o atendimento</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">✓</span>
                      <span>Organize seus scripts por categorias usando títulos descritivos</span>
                    </li>
                  </ul>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                onClick={() => setModalInstrucoes(false)}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 active:scale-95"
              >
                Entendi, vamos começar!
              </button>
            </div>

          </div>
        </div>
      )}

      {modalLogoutAberto && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
            {!despedindo ? (
              <>
                <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <LogOut size={32} />
                </div>
                <h3 className="text-xl font-extrabold text-slate-800 mb-2">Tem certeza mesmo que deseja sair?</h3>
                <p className="text-slate-500 text-sm mb-6">Você será desconectado do sistema.</p>
                <div className="flex gap-3">
                  <button onClick={() => setModalLogoutAberto(false)} className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
                    Cancelar
                  </button>
                  <button onClick={confirmarLogout} className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-200">
                    Sim, sair
                  </button>
                </div>
              </>
            ) : (
              <div className="py-8 animate-in fade-in duration-300">
                <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Poxa =/</h3>
                <p className="text-slate-500 font-medium text-lg">Até breve então!</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        /* IMPORTAR FONTES DO GOOGLE FONTS */
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Open+Sans:wght@400;700&family=Lato:wght@400;700&family=Montserrat:wght@400;700&family=Poppins:wght@400;700&family=Raleway:wght@400;700&family=Ubuntu:wght@400;700&display=swap');
        
        /* CONFIGURAR FONTES NO QUILL */
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="sans-serif"]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="sans-serif"]::before {
          content: 'Sans Serif';
          font-family: 'Helvetica', 'Arial', sans-serif;
        }
        .ql-font-sans-serif {
          font-family: 'Helvetica', 'Arial', sans-serif;
        }
        
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="serif"]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="serif"]::before {
          content: 'Serif';
          font-family: 'Georgia', serif;
        }
        .ql-font-serif {
          font-family: 'Georgia', serif;
        }
        
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="monospace"]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="monospace"]::before {
          content: 'Monospace';
          font-family: 'Monaco', 'Courier New', monospace;
        }
        .ql-font-monospace {
          font-family: 'Monaco', 'Courier New', monospace;
        }
        
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="arial"]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="arial"]::before {
          content: 'Arial';
          font-family: Arial, sans-serif;
        }
        .ql-font-arial {
          font-family: Arial, sans-serif;
        }
        
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="georgia"]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="georgia"]::before {
          content: 'Georgia';
          font-family: Georgia, serif;
        }
        .ql-font-georgia {
          font-family: Georgia, serif;
        }
        
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="impact"]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="impact"]::before {
          content: 'Impact';
          font-family: Impact, sans-serif;
        }
        .ql-font-impact {
          font-family: Impact, sans-serif;
        }
        
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="tahoma"]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="tahoma"]::before {
          content: 'Tahoma';
          font-family: Tahoma, sans-serif;
        }
        .ql-font-tahoma {
          font-family: Tahoma, sans-serif;
        }
        
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="times-new-roman"]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="times-new-roman"]::before {
          content: 'Times New Roman';
          font-family: 'Times New Roman', serif;
        }
        .ql-font-times-new-roman {
          font-family: 'Times New Roman', serif;
        }
        
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="verdana"]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="verdana"]::before {
          content: 'Verdana';
          font-family: Verdana, sans-serif;
        }
        .ql-font-verdana {
          font-family: Verdana, sans-serif;
        }
        
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="roboto"]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="roboto"]::before {
          content: 'Roboto';
          font-family: 'Roboto', sans-serif;
        }
        .ql-font-roboto {
          font-family: 'Roboto', sans-serif;
        }
        
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="open-sans"]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="open-sans"]::before {
          content: 'Open Sans';
          font-family: 'Open Sans', sans-serif;
        }
        .ql-font-open-sans {
          font-family: 'Open Sans', sans-serif;
        }
        
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="lato"]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="lato"]::before {
          content: 'Lato';
          font-family: 'Lato', sans-serif;
        }
        .ql-font-lato {
          font-family: 'Lato', sans-serif;
        }
        
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="montserrat"]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="montserrat"]::before {
          content: 'Montserrat';
          font-family: 'Montserrat', sans-serif;
        }
        .ql-font-montserrat {
          font-family: 'Montserrat', sans-serif;
        }
        
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="poppins"]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="poppins"]::before {
          content: 'Poppins';
          font-family: 'Poppins', sans-serif;
        }
        .ql-font-poppins {
          font-family: 'Poppins', sans-serif;
        }
        
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="raleway"]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="raleway"]::before {
          content: 'Raleway';
          font-family: 'Raleway', sans-serif;
        }
        .ql-font-raleway {
          font-family: 'Raleway', sans-serif;
        }
        
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="ubuntu"]::before,
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="ubuntu"]::before {
          content: 'Ubuntu';
          font-family: 'Ubuntu', sans-serif;
        }
        .ql-font-ubuntu {
          font-family: 'Ubuntu', sans-serif;
        }
        
        /* Estilos para leitura de conteúdo formatado */
        .modal-leitura .ql-editor { 
          padding: 0 !important; 
          font-size: 16px !important; 
          color: #334155; 
          line-height: 1.8;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        
        /* Parágrafos */
        .modal-leitura .ql-editor p { 
          margin-bottom: 1em !important; 
          white-space: pre-wrap;
        }
        
        /* Quebras de linha */
        .modal-leitura .ql-editor br {
          display: block;
          content: "";
          margin-top: 0.5em;
        }
        
        /* Listas */
        .modal-leitura .ql-editor ul { 
          list-style-type: disc !important; 
          padding-left: 2em !important; 
          margin-bottom: 1em !important;
          margin-top: 0.5em !important;
        }
        .modal-leitura .ql-editor ol { 
          list-style-type: decimal !important; 
          padding-left: 2em !important; 
          margin-bottom: 1em !important;
          margin-top: 0.5em !important;
        }
        .modal-leitura .ql-editor li {
          margin-bottom: 0.5em !important;
          padding-left: 0.5em !important;
        }
        
        /* Formatação de texto */
        .modal-leitura .ql-editor strong { 
          font-weight: 700 !important; 
        }
        .modal-leitura .ql-editor em { 
          font-style: italic !important; 
        }
        .modal-leitura .ql-editor u { 
          text-decoration: underline !important; 
        }
        .modal-leitura .ql-editor s { 
          text-decoration: line-through !important; 
        }
        
        /* Links */
        .modal-leitura .ql-editor a { 
          color: #2563eb; 
          text-decoration: underline;
          cursor: pointer;
        }
        .modal-leitura .ql-editor a:hover { 
          color: #1d4ed8; 
        }
        
        /* Cabeçalhos */
        .modal-leitura .ql-editor h1 { 
          font-size: 2em !important; 
          font-weight: 700 !important; 
          margin-top: 1em !important; 
          margin-bottom: 0.5em !important; 
        }
        .modal-leitura .ql-editor h2 { 
          font-size: 1.5em !important; 
          font-weight: 700 !important; 
          margin-top: 1em !important; 
          margin-bottom: 0.5em !important; 
        }
        .modal-leitura .ql-editor h3 { 
          font-size: 1.25em !important; 
          font-weight: 600 !important; 
          margin-top: 0.8em !important; 
          margin-bottom: 0.5em !important; 
        }
        
        /* Imagens */
        .modal-leitura .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1.5em auto;
          display: block;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        
        /* Citações */
        .modal-leitura .ql-editor blockquote {
          border-left: 4px solid #e2e8f0;
          padding-left: 1em;
          margin-left: 0;
          margin-right: 0;
          margin-top: 1em;
          margin-bottom: 1em;
          color: #64748b;
          font-style: italic;
        }
        
        /* Código */
        .modal-leitura .ql-editor code {
          background-color: #f1f5f9;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
        .modal-leitura .ql-editor pre {
          background-color: #1e293b;
          color: #e2e8f0;
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
          margin: 1em 0;
        }
        .modal-leitura .ql-editor pre code {
          background-color: transparent;
          padding: 0;
          color: inherit;
        }
        
        /* Alinhamento */
        .modal-leitura .ql-editor .ql-align-center {
          text-align: center;
        }
        .modal-leitura .ql-editor .ql-align-right {
          text-align: right;
        }
        .modal-leitura .ql-editor .ql-align-justify {
          text-align: justify;
        }
        
        /* Estilos do editor */
        .ql-toolbar.ql-snow { 
          border: none !important; 
          border-bottom: 1px solid #e2e8f0 !important; 
          background-color: #f8fafc;
        }
        .ql-container.ql-snow { 
          border: none !important; 
        }
      `}</style>
    </div>
  );
}