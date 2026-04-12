import { useState, useEffect, useCallback, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import { 
  Search, Tag, FileText, Calendar, Paperclip, X, BookOpen, 
  MessageSquare, Users, Plus, Copy, Lock, Globe, Trash2, Edit2, CheckCircle2, AlertCircle, Download, LogOut, Heart, Bell
} from 'lucide-react';
import 'react-quill-new/dist/quill.snow.css';

const modulosQuillSimples = {
  toolbar: [
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link'], 
    ['clean']
  ]
};

export default function DashboardAtendente() {
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
  // BUSCAS NA API (COM CACHE-BUSTER INFALÍVEL)
  // ==========================================================
  const buscarComunicados = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3000/comunicados?_t=${Date.now()}`);
      if (response.ok) setListaComunicados(await response.json());
    } catch (error) { console.error('Erro na busca de comunicados'); }
  }, []);

  const buscarScripts = useCallback(async () => {
    if (!usuarioId) return;
    try {
      const response = await fetch(`http://localhost:3000/scripts/${usuarioId}?_t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        setListaScripts(data || []);
      }
    } catch (error) { console.error('Erro de rede ao buscar scripts'); }
  }, [usuarioId]);

  const buscarNotificacoes = useCallback(async () => {
    if (!usuarioId) return;
    try {
      const response = await fetch(`http://localhost:3000/notificacoes/${usuarioId}?_t=${Date.now()}`);
      if (response.ok) setNotificacoes(await response.json());
    } catch (error) { console.error('Erro ao buscar notificações'); }
  }, [usuarioId]);

  // Efeito Inicial e Radar de Atualização
  useEffect(() => {
    setCarregando(true);
    Promise.all([buscarComunicados(), buscarScripts(), buscarNotificacoes()]).finally(() => setCarregando(false));

    // Radar bate no servidor a cada 5 segundos
    const radar = setInterval(() => {
      buscarNotificacoes();
      buscarComunicados(); 
    }, 5000);

    return () => clearInterval(radar);
  }, [buscarComunicados, buscarScripts, buscarNotificacoes]);

  // ==========================================================
  // EFEITO SONORO DE NOTIFICAÇÃO (CORRIGIDO)
  // ==========================================================
  useEffect(() => {
    const naoLidasAtuais = notificacoes.filter(n => !n.lida).length;

    if (!primeiraCarga.current && naoLidasAtuais > totalNaoLidasAnterior.current) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5; 
      audio.play().catch(e => console.log('O navegador bloqueou o áudio porque o utilizador ainda não clicou na tela.'));
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
      await fetch('http://localhost:3000/comunicados/ler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuarioId, comunicado_id: comunicado.id })
      });
    } catch (error) { console.log("Rastreio falhou."); }
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
      await fetch(`http://localhost:3000/comunicados/${comunicadoId}/curtir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuarioId })
      });
    } catch (error) {
      mostrarMensagem('Erro ao registrar curtida.', 'erro');
      buscarComunicados(); 
    }
  };

  const lerNotificacao = async (notificacao, e) => {
    if (e) e.stopPropagation();

    if (!notificacao.lida) {
      setNotificacoes(prev => prev.map(n => n.id === notificacao.id ? { ...n, lida: true } : n));
      fetch(`http://localhost:3000/notificacoes/${notificacao.id}/ler`, { method: 'PUT' }).catch(console.error);
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
  const salvarScript = async (e) => { e.preventDefault(); if (!tituloScript || !conteudoScript) return mostrarMensagem('Preencha título e conteúdo', 'erro'); try { const url = idEmEdicaoScript ? `http://localhost:3000/scripts/${idEmEdicaoScript}` : 'http://localhost:3000/scripts'; const metodo = idEmEdicaoScript ? 'PUT' : 'POST'; const formData = new FormData(); formData.append('titulo', tituloScript); formData.append('conteudo', conteudoScript); formData.append('autor_id', usuarioId); formData.append('visivel_equipe', compartilharScript); if (arquivosScript) { Array.from(arquivosScript).forEach(arq => formData.append('arquivos', arq)); } const response = await fetch(url, { method: metodo, body: formData }); if (response.ok) { mostrarMensagem(idEmEdicaoScript ? 'Script atualizado!' : 'Script salvo!'); cancelarEdicaoScript(); buscarScripts(); } else { mostrarMensagem('Falha ao salvar', 'erro'); } } catch (error) { mostrarMensagem('Erro de Rede.', 'erro'); } };
  const deletarScript = async (id, e) => { e.stopPropagation(); if (!window.confirm("Apagar este script?")) return; try { const response = await fetch(`http://localhost:3000/scripts/${id}`, { method: 'DELETE' }); if (response.ok) { mostrarMensagem('Script apagado.'); buscarScripts(); } } catch (error) { mostrarMensagem('Erro ao apagar.', 'erro'); } };
  const copiarParaAreaTransferencia = (html, titulo, e) => { if (e) e.stopPropagation(); const el = document.createElement('div'); el.innerHTML = html; navigator.clipboard.writeText(el.innerText || el.textContent).then(() => mostrarMensagem(`"${titulo}" copiado!`, 'sucesso')).catch(() => mostrarMensagem('Falha.', 'erro')); };

  // ==========================================================
  // FILTROS E VARIÁVEIS DE TELA
  // ==========================================================
  const termo = termoBusca.toLowerCase();
  const comunicadosFiltrados = listaComunicados.filter(c => c.titulo.toLowerCase().includes(termo) || c.tags.toLowerCase().includes(termo));
  const meusScripts = listaScripts.filter(s => String(s.autor_id).trim() === usuarioId && s.titulo.toLowerCase().includes(termo));
  const scriptsEquipe = listaScripts.filter(s => String(s.autor_id).trim() !== usuarioId && s.visivel_equipe && s.titulo.toLowerCase().includes(termo));
  
  const naoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-900 relative pb-24" onClick={() => setPainelNotificacoesAberto(false)}>
      
      {mensagem.texto && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 fade-in duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${mensagem.tipo === 'erro' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-800 border-emerald-900 text-white'}`}>
            {mensagem.tipo === 'erro' ? <AlertCircle size={20}/> : <CheckCircle2 size={20}/>}
            <span className="font-bold">{mensagem.texto}</span>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative">
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-200">
                <BookOpen size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Portal do Atendente</h1>
                <p className="text-slate-500 text-sm">A sua central de conhecimento e agilidade.</p>
              </div>
            </div>
            
            <div className="flex md:hidden items-center gap-2 relative">
              <button onClick={(e) => { e.stopPropagation(); setPainelNotificacoesAberto(!painelNotificacoesAberto); }} className="relative p-2 text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                <Bell size={20} />
                {naoLidas > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>}
              </button>
              <button onClick={() => setModalLogoutAberto(true)} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100">
                <LogOut size={20} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto relative">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Pesquisa rápida..." value={termoBusca} onChange={(e) => setTermoBusca(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"/>
            </div>
            
            <div className="hidden md:flex items-center gap-3">
              <button onClick={(e) => { e.stopPropagation(); setPainelNotificacoesAberto(!painelNotificacoesAberto); }} className="relative p-2.5 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl transition-all">
                <Bell size={20} />
                {naoLidas > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full shadow-sm shadow-red-200 border-2 border-white animate-in zoom-in">
                    {naoLidas > 9 ? '9+' : naoLidas}
                  </span>
                )}
              </button>
              <button onClick={() => setModalLogoutAberto(true)} className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl transition-colors border border-red-100 shrink-0">
                <LogOut size={18} /> Sair
              </button>
            </div>

            {painelNotificacoesAberto && (
              <div onClick={(e) => e.stopPropagation()} className="absolute top-full right-0 mt-3 w-[calc(100vw-2rem)] md:w-96 bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4">
                <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center">
                  <h4 className="font-extrabold text-slate-800 flex items-center gap-2"><Bell size={16} className="text-slate-400"/> Notificações</h4>
                  {naoLidas > 0 && <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-1 rounded-lg uppercase tracking-wider">{naoLidas} Novas</span>}
                </div>
                
                <div className="max-h-[350px] overflow-y-auto p-2">
                  {notificacoes.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Bell size={24} className="mx-auto mb-2 opacity-20"/>
                      <p className="text-sm font-medium">Nenhum aviso novo.</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notificacoes.map(n => (
                        <div key={n.id} onClick={(e) => lerNotificacao(n, e)} className={`p-4 rounded-2xl cursor-pointer transition-all border border-transparent relative overflow-hidden ${n.lida ? 'hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50 hover:border-blue-100'}`}>
                          {!n.lida && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>}
                          <h5 className={`text-sm mb-1 ${n.lida ? 'font-bold text-slate-600' : 'font-extrabold text-slate-900'}`}>{n.titulo}</h5>
                          <p className={`text-xs ${n.lida ? 'text-slate-400' : 'text-slate-600'}`}>{n.mensagem}</p>
                          <div className="flex items-center justify-between mt-2">
                             <span className="text-[10px] text-slate-400 font-bold block">{new Date(n.criado_em).toLocaleDateString('pt-BR')}</span>
                             {n.comunicado_id && <span className="text-[10px] text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">Ler Agora &rarr;</span>}
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

        <div className="flex overflow-x-auto hide-scrollbar gap-2 p-1 bg-slate-200/50 rounded-2xl w-fit">
          <button onClick={() => setAbaAtiva('comunicados')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${abaAtiva === 'comunicados' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><FileText size={18}/> Comunicados Oficiais</button>
          <button onClick={() => setAbaAtiva('meus_scripts')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${abaAtiva === 'meus_scripts' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><MessageSquare size={18}/> Meus Scripts</button>
          <button onClick={() => setAbaAtiva('comunidade')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${abaAtiva === 'comunidade' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Users size={18}/> Scripts da Equipa</button>
        </div>

        {carregando ? (
           <div className="text-center py-20"><div className="h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" /></div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

            {abaAtiva === 'comunicados' && (
              <div className="grid gap-4">
                {comunicadosFiltrados.length === 0 ? <p className="text-center text-slate-400 py-10">Nenhum comunicado encontrado.</p> : 
                  comunicadosFiltrados.map((comunicado) => {
                    const totalCurtidas = comunicado.curtidas_comunicados?.length || 0;
                    const jaCurtiu = comunicado.curtidas_comunicados?.some(curtida => curtida.usuario_id === usuarioId);

                    return (
                      <div key={comunicado.id} onClick={() => registrarLeitura(comunicado)} className="group bg-white p-6 rounded-3xl border border-slate-100 cursor-pointer hover:shadow-lg transition-all flex flex-col relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        
                        <div>
                          <h3 className="font-extrabold text-lg text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{comunicado.titulo}</h3>
                          <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                            <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(comunicado.criado_em).toLocaleDateString()}</span>
                            <span className="text-blue-500 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded"><Tag size={12}/> {comunicado.tags}</span>
                            {comunicado.anexos_comunicados?.length > 0 && (
                               <span className="text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded"><Paperclip size={12}/> {comunicado.anexos_comunicados.length}</span>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                          <button 
                            onClick={(e) => toggleCurtida(comunicado.id, e)} 
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${jaCurtiu ? 'text-red-500 bg-red-50 hover:bg-red-100' : 'text-slate-400 bg-slate-50 hover:bg-slate-100 hover:text-red-400'}`}
                          >
                            <Heart size={18} className={jaCurtiu ? 'fill-current scale-110 transition-transform' : 'transition-transform'} />
                            {totalCurtidas > 0 ? `${totalCurtidas} Curtidas` : 'Curtir'}
                          </button>
                          
                          <span className="text-blue-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">Ler Comunicado &rarr;</span>
                        </div>

                      </div>
                    );
                  })
                }
              </div>
            )}

            {abaAtiva === 'meus_scripts' && (
              <div className="space-y-6">
                {!formScriptAberto ? (
                  <button onClick={() => setFormScriptAberto(true)} className="w-full py-6 border-2 border-dashed border-slate-300 rounded-3xl text-slate-500 font-bold hover:bg-white hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2">
                    <Plus size={20}/> Criar Novo Atalho/Script
                  </button>
                ) : (
                  <form onSubmit={salvarScript} className={`bg-white p-6 md:p-8 rounded-3xl shadow-lg border animate-in zoom-in-95 ${idEmEdicaoScript ? 'border-orange-200 ring-2 ring-orange-50' : 'border-blue-100'}`}>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className={`font-bold text-lg ${idEmEdicaoScript ? 'text-orange-600' : 'text-slate-800'}`}>
                        {idEmEdicaoScript ? 'Editar Script' : 'Novo Script'}
                      </h3>
                      <button type="button" onClick={cancelarEdicaoScript} className="text-slate-400 hover:text-red-500"><X size={20}/></button>
                    </div>
                    <div className="space-y-4">
                      <input type="text" placeholder="Título (ex: Saudação de Bom Dia)" value={tituloScript} onChange={e => setTituloScript(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" required/>
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
                            <p className="font-bold text-sm text-slate-800 flex items-center gap-2">Partilhar com a Equipa {compartilharScript ? <Globe size={16} className="text-blue-500"/> : <Lock size={16} className="text-slate-400"/>}</p>
                          </div>
                        </label>
                      </div>

                      <button type="submit" className={`w-full py-4 text-white font-bold rounded-xl transition-all shadow-md ${idEmEdicaoScript ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {idEmEdicaoScript ? 'Atualizar Script' : 'Guardar Script'}
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {meusScripts.length === 0 && !formScriptAberto ? <p className="text-slate-400 col-span-2 text-center py-10">Nenhum script na sua tela no momento.</p> : 
                    meusScripts.map(script => (
                      <div key={script.id} onClick={() => setScriptVisualizado(script)} className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col h-full shadow-sm hover:shadow-md transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-extrabold text-slate-800 group-hover:text-blue-600 transition-colors">{script.titulo}</h4>
                          <span title={script.visivel_equipe ? "Público" : "Privado"} className={`p-1.5 rounded-lg ${script.visivel_equipe ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 text-slate-400'}`}>
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
                          <button onClick={(e) => copiarParaAreaTransferencia(decodificarHTML(script.conteudo), script.titulo, e)} className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold py-2.5 rounded-xl transition-colors">
                            <Copy size={16}/> Copiar
                          </button>
                          <button onClick={(e) => abrirParaEdicao(script, e)} className="p-2.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-xl transition-colors">
                            <Edit2 size={16}/>
                          </button>
                          <button onClick={(e) => deletarScript(script.id, e)} className="p-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scriptsEquipe.length === 0 ? <p className="text-slate-400 col-span-2 text-center py-10">A equipa ainda não partilhou nenhum script.</p> : 
                  scriptsEquipe.map(script => (
                    <div key={script.id} onClick={() => setScriptVisualizado(script)} className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-3xl border border-blue-100 flex flex-col h-full shadow-sm hover:shadow-md transition-all relative overflow-hidden cursor-pointer group">
                      <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">Da Equipa</div>
                      <h4 className="font-extrabold text-slate-800 pr-16 mb-1 group-hover:text-blue-600 transition-colors">{script.titulo}</h4>
                      <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1">Criado por: <strong className="text-slate-600">{script.usuarios?.nome_completo || 'Desconhecido'}</strong></p>
                      
                      {script.anexos_scripts?.length > 0 && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded w-fit mb-3 flex items-center gap-1 font-bold">
                            <Paperclip size={10}/> {script.anexos_scripts.length} anexo(s)
                          </span>
                      )}

                      <div className="flex-1 mb-6 text-sm text-slate-600 line-clamp-2" dangerouslySetInnerHTML={{__html: decodificarHTML(script.conteudo)}} />
                      
                      <div className="mt-auto pt-4 border-t border-slate-200">
                        <button onClick={(e) => copiarParaAreaTransferencia(decodificarHTML(script.conteudo), script.titulo, e)} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors shadow-md shadow-blue-200">
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
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start gap-4 shrink-0">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight mb-3">
                  {publicacaoVisualizada ? publicacaoVisualizada.titulo : scriptVisualizado.titulo}
                </h2>
                {scriptVisualizado && (
                  <button onClick={() => copiarParaAreaTransferencia(decodificarHTML(scriptVisualizado.conteudo), scriptVisualizado.titulo)} className="flex items-center gap-2 text-sm font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-xl transition-colors">
                    <Copy size={16}/> Copiar Texto Inteiro
                  </button>
                )}
              </div>
              <button onClick={() => { setPublicacaoVisualizada(null); setScriptVisualizado(null); }} className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all shrink-0">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 md:p-10 overflow-y-auto bg-white modal-leitura">
               <div className="ql-snow">
                  <div className="ql-editor text-slate-800" dangerouslySetInnerHTML={{ __html: decodificarHTML(publicacaoVisualizada ? publicacaoVisualizada.conteudo : scriptVisualizado.conteudo) }} />
               </div>
            </div>

            {((publicacaoVisualizada?.anexos_comunicados?.length > 0) || (scriptVisualizado?.anexos_scripts?.length > 0)) && (
              <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50 shrink-0">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Paperclip size={14}/> Arquivos em Anexo
                </h4>
                <div className="flex flex-wrap gap-3">
                  {(publicacaoVisualizada ? publicacaoVisualizada.anexos_comunicados : scriptVisualizado.anexos_scripts).map((anexo) => (
                    <a key={anexo.id} href={anexo.url_arquivo} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-blue-400 hover:text-blue-700 transition-all shadow-sm">
                      <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
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
        .modal-leitura .ql-editor { padding: 0 !important; font-size: 16px !important; color: #334155; line-height: 1.6; }
        .modal-leitura .ql-editor ul { list-style-type: disc !important; padding-left: 1.5em !important; margin-bottom: 1em !important; }
        .modal-leitura .ql-editor ol { list-style-type: decimal !important; padding-left: 1.5em !important; margin-bottom: 1em !important; }
        .modal-leitura .ql-editor a { color: #2563eb; text-decoration: underline; }
        .ql-toolbar.ql-snow { border: none !important; border-bottom: 1px solid #e2e8f0 !important; background-color: #f8fafc;}
        .ql-container.ql-snow { border: none !important; }
      `}</style>
    </div>
  );
}