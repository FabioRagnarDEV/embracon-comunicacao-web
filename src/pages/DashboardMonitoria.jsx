import { useState, useEffect, useCallback, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import { 
  Plus, Search, Edit2, Trash2, X, Save, 
  Paperclip, Tag, FileText, Calendar, AlertCircle, CheckCircle2,
  BarChart3, Flame, Clock, Users, LogOut, Heart 
} from 'lucide-react';

import 'react-quill-new/dist/quill.snow.css';

// Configuração do Toolbar
const modulosQuill = {
  toolbar: [
    [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image'],
    ['clean']
  ]
};

export default function DashboardMonitoria() {
  const [abaAtiva, setAbaAtiva] = useState('comunicados');

  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [tags, setTags] = useState('');
  const [arquivos, setArquivos] = useState(null);
  const [idEmEdicao, setIdEmEdicao] = useState(null);
  
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' });
  const [carregando, setCarregando] = useState(false);
  const [listaComunicados, setListaComunicados] = useState([]);
  const [termoBusca, setTermoBusca] = useState('');
  
  const [publicacaoVisualizada, setPublicacaoVisualizada] = useState(null);
  const fileInputRef = useRef(null);

  const [metricas, setMetricas] = useState({ ranking: [], historico: [] });
  const [buscaRelatorio, setBuscaRelatorio] = useState('');

  const [modalLogoutAberto, setModalLogoutAberto] = useState(false);
  const [despedindo, setDespedindo] = useState(false);

  const confirmarLogout = () => {
    setDespedindo(true); 
    setTimeout(() => {
      localStorage.clear(); 
      window.location.href = '/'; 
    }, 1500); 
  };

  const decodificarHTML = (html) => {
    if (!html) return '<p class="text-slate-400 italic">Este comunicado não possui texto.</p>';
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  const mostrarMensagem = (texto, tipo = 'sucesso') => {
    setMensagem({ texto, tipo });
    setTimeout(() => setMensagem({ texto: '', tipo: '' }), 5000);
  };

  const buscarComunicados = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3000/comunicados');
      if (response.ok) {
        const data = await response.json();
        setListaComunicados(data);
      }
    } catch (error) {
      mostrarMensagem('Erro ao carregar dados do servidor.', 'erro');
    }
  }, []);

  const buscarRelatorios = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3000/relatorios');
      if (response.ok) {
        const data = await response.json();
        setMetricas(data);
      }
    } catch (error) {
      console.error('Erro ao carregar relatórios.');
    }
  }, []);

  useEffect(() => {
    buscarComunicados();
    buscarRelatorios();
  }, [buscarComunicados, buscarRelatorios]);

  const carregarParaEdicao = (comunicado) => {
    setTitulo(comunicado.titulo);
    setConteudo(decodificarHTML(comunicado.conteudo));
    setTags(comunicado.tags);
    setIdEmEdicao(comunicado.id);
    mostrarMensagem('Modo de edição ativado. Altere os campos desejados.', 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicao = () => {
    setTitulo('');
    setConteudo('');
    setTags('');
    setArquivos(null);
    setIdEmEdicao(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSalvarComunicado = async (e) => {
    e.preventDefault();
    setCarregando(true);
    const autorIdRaw = localStorage.getItem('usuario_id') || '';
    const autorId = autorIdRaw.replace(/['"]/g, '').trim();

    if (!autorId) {
      mostrarMensagem('Identificação perdida. Por favor, faça login novamente.', 'erro');
      setCarregando(false);
      return;
    }

    try {
      const url = idEmEdicao 
        ? `http://localhost:3000/comunicados/${idEmEdicao}` 
        : 'http://localhost:3000/comunicados';
      
      const metodo = idEmEdicao ? 'PUT' : 'POST';
      const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('conteudo', conteudo);
      formData.append('tags', tags);
      formData.append('autor_id', autorId);

      if (arquivos) {
        Array.from(arquivos).forEach(arq => formData.append('arquivos', arq));
      }

      const response = await fetch(url, { method: metodo, body: formData });
      
      if (response.ok) {
        mostrarMensagem(idEmEdicao ? 'Comunicado atualizado com sucesso!' : 'Comunicado publicado com sucesso!');
        cancelarEdicao();
        buscarComunicados();
      } else {
        mostrarMensagem('Erro ao salvar no banco de dados.', 'erro');
      }
    } catch (err) {
      mostrarMensagem('Falha de conexão com o servidor.', 'erro');
    } finally {
      setCarregando(false);
    }
  };

  const handleDeletarComunicado = async (id) => {
    if (!window.confirm("Deseja realmente excluir este comunicado? Esta ação é irreversível.")) return;

    try {
      const response = await fetch(`http://localhost:3000/comunicados/${id}`, { method: 'DELETE' });
      if (response.ok) {
        mostrarMensagem('Comunicado removido permanentemente.', 'sucesso');
        if (idEmEdicao === id) cancelarEdicao();
        buscarComunicados();
      }
    } catch (error) {
      mostrarMensagem('Erro ao tentar excluir.', 'erro');
    }
  };

  const comunicadosFiltrados = listaComunicados.filter(c => 
    c.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ||
    c.tags.toLowerCase().includes(termoBusca.toLowerCase())
  );

  const historicoFiltrado = metricas.historico.filter(log => 
    log.usuarios?.nome_completo?.toLowerCase().includes(buscaRelatorio.toLowerCase()) ||
    log.comunicados_oficiais?.titulo?.toLowerCase().includes(buscaRelatorio.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-900 relative">
      <div className="max-w-5xl mx-auto space-y-10">

        <style>{`
        /* DOMANDO O EDITOR DE TEXTO (Criação e Modal) */
        .form-editor .ql-editor {
          min-height: 300px;
          height: auto !important;
          font-size: 16px;
        }
        .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid #e2e8f0 !important;
          background-color: #f8fafc;
          border-top-left-radius: 1rem;
          border-top-right-radius: 1rem;
        }
        .ql-container.ql-snow {
          border: none !important;
        }
        /* Ajustes específicos para a Leitura no Modal ficar idêntica ao Word */
        .modal-leitura .ql-editor {
          padding: 0 !important;
          font-size: 16px !important;
          color: #334155;
          line-height: 1.6;
        }
        .modal-leitura .ql-editor ul {
          list-style-type: disc !important;
          padding-left: 1.5em !important;
          margin-bottom: 1em !important;
        }
        .modal-leitura .ql-editor ol {
          list-style-type: decimal !important;
          padding-left: 1.5em !important;
          margin-bottom: 1em !important;
        }
        .modal-leitura .ql-editor img {
          max-width: 100%;
          border-radius: 8px;
          margin: 1.5em auto;
          display: block;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
      `}</style>
        
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Knowledge Hub</h1>
            <p className="text-slate-500 text-sm">Gestão de comunicados e monitoria técnica.</p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="flex items-center gap-3">
              <span className="hidden md:inline-block bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
                PAINEL ADMINISTRATIVO
              </span>
              <button onClick={() => setModalLogoutAberto(true)} className="flex items-center gap-2 px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-bold rounded-xl transition-colors border border-red-100">
                <LogOut size={16} /> Sair
              </button>
            </div>
            <div className="flex gap-2 p-1 bg-slate-200/50 rounded-2xl w-fit">
              <button onClick={() => setAbaAtiva('comunicados')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${abaAtiva === 'comunicados' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <FileText size={16}/> Comunicados
              </button>
              <button onClick={() => setAbaAtiva('relatorios')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${abaAtiva === 'relatorios' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <BarChart3 size={16}/> Relatórios
              </button>
            </div>
          </div>
        </header>

        {abaAtiva === 'comunicados' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            {/* FORMULÁRIO DE PUBLICAÇÃO */}
            <section className={`bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 transition-all duration-500 ${idEmEdicao ? 'ring-2 ring-orange-400' : ''}`}>
              <div className="p-1 border-b border-slate-50 bg-slate-50/50">
                <div className={`px-6 py-3 flex items-center gap-2 font-bold text-sm ${idEmEdicao ? 'text-orange-600' : 'text-blue-600'}`}>
                  {idEmEdicao ? <Edit2 size={16}/> : <Plus size={16}/>}
                  {idEmEdicao ? 'MODO DE EDIÇÃO' : 'NOVA PUBLICAÇÃO'}
                </div>
              </div>

              <form onSubmit={handleSalvarComunicado} className="p-8 space-y-6">
                {mensagem.texto && (
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border animate-in fade-in slide-in-from-top-2 ${
                    mensagem.tipo === 'erro' ? 'bg-red-50 border-red-100 text-red-700' : 
                    mensagem.tipo === 'info' ? 'bg-amber-50 border-amber-100 text-amber-800' : 
                    'bg-emerald-50 border-emerald-100 text-emerald-800'
                  }`}>
                    {mensagem.tipo === 'erro' ? <AlertCircle size={18}/> : <CheckCircle2 size={18}/>}
                    <span className="text-sm font-medium">{mensagem.texto}</span>
                  </div>
                )}

                <div className="grid gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Título do Comunicado</label>
                    <input 
                      type="text" 
                      value={titulo} 
                      onChange={(e) => setTitulo(e.target.value)} 
                      placeholder="Ex: Atualização de Procedimento de Troca"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none border" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Conteúdo</label>
                    <div className="form-editor rounded-2xl border border-slate-200 overflow-hidden focus-within:ring-4 focus-within:ring-blue-500/10 transition-all bg-white shadow-sm">
                      <ReactQuill 
                        theme="snow" 
                        value={conteudo} 
                        onChange={setConteudo} 
                        modules={modulosQuill} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                        <Tag size={12}/> Tags de Busca
                      </label>
                      <input 
                        type="text" 
                        value={tags} 
                        onChange={(e) => setTags(e.target.value)} 
                        placeholder="processos, logistica, sac"
                        className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none border text-sm" 
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                        <Paperclip size={12}/> Anexar Arquivos (Até 50MB)
                      </label>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        multiple 
                        onChange={(e) => setArquivos(e.target.files)}
                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-all cursor-pointer bg-slate-50 rounded-2xl p-1 border border-dashed border-slate-200" 
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 pt-4">
                  <button 
                    type="submit" 
                    disabled={carregando}
                    className={`flex-1 flex items-center justify-center gap-2 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 ${
                      idEmEdicao ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                    }`}
                  >
                    {carregando ? (
                      <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={18}/>
                        {idEmEdicao ? 'Atualizar Comunicado' : 'Publicar Agora'}
                      </>
                    )}
                  </button>
                  
                  {idEmEdicao && (
                    <button 
                      type="button" 
                      onClick={cancelarEdicao} 
                      className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-4 px-8 rounded-2xl transition-all"
                    >
                      <X size={18}/> Cancelar
                    </button>
                  )}
                </div>
              </form>
            </section>

            {/* LISTAGEM E BUSCA */}
            <section className="space-y-6 pb-20">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Histórico de Publicações</h2>
                  <p className="text-slate-500 text-sm">Visualize e gerencie os conteúdos existentes.</p>
                </div>
                
                <div className="relative w-full md:w-80 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Pesquisar por título ou tag..." 
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
              
              <div className="grid gap-4">
                {comunicadosFiltrados.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="text-slate-300" size={32} />
                    </div>
                    <p className="text-slate-400 font-medium italic">Nenhum registro encontrado para sua busca.</p>
                  </div>
                ) : (
                  comunicadosFiltrados.map((comunicado) => (
                    <div key={comunicado.id} className="bg-white rounded-3xl border border-slate-100 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 overflow-hidden">
                      <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        
                        <div className="flex-1">
                          <h3 className="font-extrabold text-xl text-slate-800 leading-tight mb-3">
                            {comunicado.titulo}
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-3 mb-5">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1">
                              <Calendar size={12}/> {new Date(comunicado.criado_em).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-xs text-blue-600 font-bold flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-lg">
                              <Tag size={12}/> {comunicado.tags}
                            </span>
                            
                            {/* SELO DE CURTIDAS AQUI */}
                            <span className="text-xs text-red-500 font-bold flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-lg">
                              <Heart size={12} className={comunicado.curtidas_comunicados?.length > 0 ? "fill-current" : ""}/> 
                              {comunicado.curtidas_comunicados?.length || 0} Curtida(s)
                            </span>

                            {comunicado.anexos_comunicados?.length > 0 && (
                              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg">
                                <Paperclip size={12}/> {comunicado.anexos_comunicados.length} Anexo(s)
                              </span>
                            )}
                          </div>

                          <button 
                            onClick={() => setPublicacaoVisualizada(comunicado)}
                            className="inline-flex items-center gap-2 text-sm font-bold text-white transition-all bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl shadow-md shadow-blue-200"
                          >
                            <FileText size={16}/> Ver publicação e Interações
                          </button>
                        </div>
                        
                        <div className="flex md:flex-col items-center justify-end gap-2 pt-4 md:pt-0 border-t md:border-0 border-slate-100 w-full md:w-auto">
                          <button 
                            onClick={() => carregarParaEdicao(comunicado)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all border border-slate-200 hover:border-orange-200"
                          >
                            <Edit2 size={16} /> Editar
                          </button>
                          <button 
                            onClick={() => handleDeletarComunicado(comunicado.id)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-200 hover:border-red-200"
                          >
                            <Trash2 size={16} /> Excluir
                          </button>
                        </div>

                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {abaAtiva === 'relatorios' && (
          <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* SESSÃO 1: RANKING DOS MAIS ACESSADOS */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 md:p-8 rounded-3xl shadow-xl border border-slate-700 text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-500/20 p-2 rounded-xl text-orange-400">
                  <Flame size={24} />
                </div>
                <h2 className="text-xl font-extrabold">Assuntos Mais Acessados (Top 5)</h2>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {metricas.ranking.length === 0 ? <p className="text-slate-400 text-sm">Ainda não há acessos registados.</p> :
                  metricas.ranking.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                      <div className={`w-8 h-8 shrink-0 flex items-center justify-center font-black rounded-full ${index === 0 ? 'bg-orange-500 text-white' : index === 1 ? 'bg-slate-300 text-slate-700' : index === 2 ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-300'}`}>
                        {index + 1}º
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base truncate pr-4">{item.titulo}</h4>
                        <p className="text-xs text-slate-400 flex items-center gap-1"><Tag size={10}/> {item.tags}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="block text-2xl font-black text-emerald-400 leading-none">{item.acessos}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Leituras</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* SESSÃO 2: AUDITORIA INDIVIDUAL */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2"><Users size={20} className="text-blue-600"/> Auditoria de Leitura Individual</h2>
                  <p className="text-sm text-slate-500">Veja exatamente quem abriu cada comunicado e quando.</p>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" placeholder="Procurar por nome ou título..." value={buscaRelatorio} onChange={(e) => setBuscaRelatorio(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"/>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-6 py-4 rounded-tl-2xl">Atendente</th>
                      <th className="px-6 py-4">Comunicado Lido</th>
                      <th className="px-6 py-4 rounded-tr-2xl">Data e Hora Exata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historicoFiltrado.length === 0 ? (
                      <tr><td colSpan="3" className="px-6 py-10 text-center text-slate-400 font-medium">Nenhum registo encontrado.</td></tr>
                    ) : (
                      historicoFiltrado.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800">{log.usuarios?.nome_completo || 'Utilizador Desconhecido'}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold">{log.usuarios?.perfil_id || 'Atendente'}</div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700 truncate max-w-xs" title={log.comunicados_oficiais?.titulo}>
                            {log.comunicados_oficiais?.titulo || 'Comunicado Apagado'}
                          </td>
                          <td className="px-6 py-4 text-slate-500 flex items-center gap-1.5 font-medium">
                            <Clock size={14}/> 
                            {new Date(log.lido_em).toLocaleDateString('pt-BR')} às {new Date(log.lido_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* MODAL TELA CHEIA (COM OS NOMES DE QUEM CURTIU)           */}
      {/* ======================================================== */}
      {publicacaoVisualizada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start gap-4 shrink-0">
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight mb-3">
                  {publicacaoVisualizada.titulo}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar size={14}/> Publicado em {new Date(publicacaoVisualizada.criado_em).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  <span className="text-xs font-bold text-blue-600 flex items-center gap-1.5">
                    <Tag size={14}/> {publicacaoVisualizada.tags}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setPublicacaoVisualizada(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-all shrink-0"
                title="Fechar Visualização"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 md:p-10 overflow-y-auto bg-white modal-leitura">
               <div className="ql-snow">
                  <div 
                    className="ql-editor text-slate-800" 
                    dangerouslySetInnerHTML={{ __html: decodificarHTML(publicacaoVisualizada.conteudo) }} 
                  />
               </div>
            </div>

            {/* LISTA DE QUEM CURTIU */}
            {publicacaoVisualizada.curtidas_comunicados?.length > 0 && (
              <div className="px-6 py-4 md:px-8 border-t border-slate-100 bg-red-50/30 shrink-0">
                <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <Heart size={14} className="fill-current"/> Curtido por ({publicacaoVisualizada.curtidas_comunicados.length} pessoas)
                </h4>
                <div className="flex flex-wrap gap-2 text-sm text-slate-700 font-bold">
                  {publicacaoVisualizada.curtidas_comunicados.map((curtida, idx) => (
                    <span key={idx} className="bg-white border border-red-100 px-3 py-1.5 rounded-lg shadow-sm">
                      {curtida.usuarios?.nome_completo || 'Utilizador Desconhecido'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {publicacaoVisualizada.anexos_comunicados?.length > 0 && (
              <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50 shrink-0">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Paperclip size={14}/> Arquivos Oficiais em Anexo
                </h4>
                <div className="flex flex-wrap gap-3">
                  {publicacaoVisualizada.anexos_comunicados.map((anexo) => (
                    <a 
                      key={anexo.id} 
                      href={anexo.url_arquivo} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-blue-400 hover:text-blue-700 transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="bg-blue-50 p-2 rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
                        <FileText size={18} />
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
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
      
    </div>
  );
}