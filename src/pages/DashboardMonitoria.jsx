import { useState, useEffect, useCallback, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import { 
  Plus, Search, Edit2, Trash2, X, Save, 
  Paperclip, Tag, FileText, Calendar, AlertCircle, CheckCircle2,
  BarChart3, Flame, Clock, Users, LogOut, Heart, Download, TrendingUp, Eye, Award, HelpCircle 
} from 'lucide-react';

import 'react-quill-new/dist/quill.snow.css';
import { comunicadosService, relatoriosService } from '../services/api';
import backgroundImage from '../assets/telainiciaMonitoria .png';

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

// Configuração do Toolbar com fontes personalizadas
const modulosQuill = {
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
    ] }, { 'size': ['small', false, 'large', 'huge'] }],
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

  // Função para fazer download do relatório em CSV
  const downloadRelatorio = () => {
    try {
      // Cabeçalho do CSV
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Posição,Título,Tags,Total de Acessos\n";
      
      // Dados do ranking
      metricas.ranking.slice(0, 5).forEach((item, index) => {
        csvContent += `${index + 1}º,"${item.titulo}","${item.tags}",${item.acessos}\n`;
      });
      
      csvContent += "\n\nAtendente,Comunicado Lido,Data e Hora\n";
      
      // Dados da auditoria
      metricas.historico.forEach((log) => {
        const nomeAtendente = log.usuarios?.nome_completo || 'Usuário Desconhecido';
        const titulo = log.comunicados_oficiais?.titulo || 'Comunicado Apagado';
        const dataHora = `${new Date(log.lido_em).toLocaleDateString('pt-BR')} ${new Date(log.lido_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        csvContent += `"${nomeAtendente}","${titulo}","${dataHora}"\n`;
      });

      // Criar link de download
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `relatorio_monitoria_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      mostrarMensagem('Relatório baixado com sucesso!', 'sucesso');
    } catch {
      mostrarMensagem('Erro ao gerar relatório', 'erro');
    }
  };

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
      const data = await comunicadosService.listar();
      setListaComunicados(data);
    } catch {
      mostrarMensagem('Erro ao carregar dados do servidor.', 'erro');
    }
  }, []);

  const buscarRelatorios = useCallback(async () => {
    try {
      const data = await relatoriosService.obterMetricas();
      setMetricas(data);
    } catch {
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

    try {
      const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('conteudo', conteudo);
      formData.append('tags', tags);

      if (arquivos) {
        Array.from(arquivos).forEach(arq => formData.append('arquivos', arq));
      }

      if (idEmEdicao) {
        await comunicadosService.atualizar(idEmEdicao, formData);
        mostrarMensagem('Comunicado atualizado com sucesso!');
      } else {
        await comunicadosService.criar(formData);
        mostrarMensagem('Comunicado publicado com sucesso!');
      }

      cancelarEdicao();
      buscarComunicados();
    } catch (err) {
      mostrarMensagem(err.message || 'Falha ao salvar comunicado.', 'erro');
    } finally {
      setCarregando(false);
    }
  };

  const handleDeletarComunicado = async (id) => {
    if (!window.confirm("Deseja realmente excluir este comunicado? Esta ação é irreversível.")) return;

    try {
      await comunicadosService.deletar(id);
      mostrarMensagem('Comunicado removido permanentemente.', 'sucesso');
      if (idEmEdicao === id) cancelarEdicao();
      buscarComunicados();
    } catch (error) {
      mostrarMensagem(error.message, 'erro');
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
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-900 relative" style={{
      backgroundImage: `linear-gradient(rgba(248, 250, 252, 0.92), rgba(248, 250, 252, 0.92)), url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <div className="max-w-5xl mx-auto space-y-10">

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
        
        /* Estilos completos para leitura de conteúdo formatado */
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
      `}</style>
        
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">
                {nomePreferido ? (
                  <>
                    {obterSaudacao()}, {nomePreferido}!
                    {tratamento && (
                      <span className="ml-2 text-2xl">
                        {tratamento === 'feminino' ? '👩‍💼' : '👨‍💼'}
                      </span>
                    )}
                  </>
                ) : (
                  'Dashboard Monitoria'
                )}
              </h1>
            </div>
            <p className="text-slate-600 font-medium mb-1">
              Aqui é o seu dashboard de Monitoria
            </p>
            <p className="text-slate-500 text-sm">
              Você pode publicar qualquer conteúdo e todos os usuários cadastrados irão ver
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setModalInstrucoes(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 active:scale-95"
              >
                <HelpCircle size={18} /> Instruções de Uso
              </button>
              <span className="hidden md:inline-block bg-[#00A859]/5 text-[#008C4A] text-xs font-bold px-3 py-1 rounded-full border border-[#00A859]/20">
                PAINEL ADMINISTRATIVO
              </span>
              <button onClick={() => setModalLogoutAberto(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 active:scale-95">
                <LogOut size={16} /> Sair
              </button>
            </div>
            <div className="flex gap-2 p-1 bg-white/80 backdrop-blur-sm rounded-2xl w-fit shadow-lg border border-slate-200">
              <button onClick={() => setAbaAtiva('comunicados')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${abaAtiva === 'comunicados' ? 'bg-gradient-to-r from-[#00A859] to-[#008C4A] text-white shadow-lg shadow-[#00A859]/20' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
                <FileText size={16}/> Comunicados
              </button>
              <button onClick={() => setAbaAtiva('relatorios')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${abaAtiva === 'relatorios' ? 'bg-gradient-to-r from-[#00A859] to-[#008C4A] text-white shadow-lg shadow-[#00A859]/20' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
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
                <div className={`px-6 py-3 flex items-center gap-2 font-bold text-sm ${idEmEdicao ? 'text-orange-600' : 'text-[#00A859]'}`}>
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
                      className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#00A859]/10 focus:border-[#00A859] transition-all outline-none border" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Conteúdo</label>
                    <div className="form-editor rounded-2xl border border-slate-200 overflow-hidden focus-within:ring-4 focus-within:ring-[#00A859]/10 transition-all bg-white shadow-sm">
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
                        className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#00A859]/10 focus:border-[#00A859] transition-all outline-none border text-sm" 
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
                    className={`flex-1 flex items-center justify-center gap-2 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-70 ${
                      idEmEdicao ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-200 hover:shadow-orange-300' : 'bg-gradient-to-r from-[#00A859] to-[#008C4A] hover:from-[#008C4A] hover:to-[#00A859] shadow-[#00A859]/20 hover:shadow-[#00A859]/30'
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
                      className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 px-8 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
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
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00A859] transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Pesquisar por título ou tag..." 
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#00A859]/10 focus:border-[#00A859] outline-none transition-all shadow-sm"
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
                            <span className="text-xs text-[#00A859] font-bold flex items-center gap-1.5 bg-[#00A859]/5 px-3 py-1.5 rounded-lg">
                              <Tag size={12}/> {comunicado.tags}
                            </span>
                            {comunicado.modificado_por_usuario ? (
                              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                                ✏️ Modificado por: {comunicado.modificado_por_usuario.email?.split('@')[0]}
                              </span>
                            ) : comunicado.autor ? (
                              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1">
                                👤 Por: {comunicado.autor.email?.split('@')[0]}
                              </span>
                            ) : null}
                            
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
                            className="inline-flex items-center gap-2 text-sm font-bold text-white transition-all bg-gradient-to-r from-[#00A859] to-[#008C4A] hover:from-[#008C4A] hover:to-[#00A859] px-5 py-2.5 rounded-xl shadow-lg shadow-[#00A859]/20 hover:shadow-xl hover:shadow-[#00A859]/30 active:scale-95"
                          >
                            <FileText size={16}/> Ver publicação e Interações
                          </button>
                        </div>
                        
                        <div className="flex md:flex-col items-center justify-end gap-2 pt-4 md:pt-0 border-t md:border-0 border-slate-100 w-full md:w-auto">
                          <button 
                            onClick={() => carregarParaEdicao(comunicado)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-orange-600 bg-orange-50 hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600 hover:text-white rounded-xl transition-all border border-orange-200 hover:border-transparent shadow-sm hover:shadow-lg hover:shadow-orange-200 active:scale-95"
                          >
                            <Edit2 size={16} /> Editar
                          </button>
                          <button 
                            onClick={() => handleDeletarComunicado(comunicado.id)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:text-white rounded-xl transition-all border border-red-200 hover:border-transparent shadow-sm hover:shadow-lg hover:shadow-red-200 active:scale-95"
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
          <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            
            {/* HEADER COM BOTÃO DE DOWNLOAD */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
                  <div className="bg-gradient-to-br from-[#00A859] to-[#008C4A] p-3 rounded-2xl text-white shadow-lg shadow-[#00A859]/20">
                    <BarChart3 size={24} />
                  </div>
                  Relatórios e Análises
                </h2>
                <p className="text-slate-500 text-sm mt-2">Insights e métricas de desempenho dos comunicados</p>
              </div>
              <button 
                onClick={downloadRelatorio}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 active:scale-95"
              >
                <Download size={20} />
                Baixar Relatório (CSV)
              </button>
            </div>

            {/* CARDS DE MÉTRICAS RESUMIDAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-[#00A859] to-[#008C4A] p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <FileText size={24} />
                    </div>
                    <TrendingUp size={20} className="text-white/60" />
                  </div>
                  <p className="text-white/80 text-sm font-bold uppercase tracking-wider mb-1">Total de Comunicados</p>
                  <p className="text-4xl font-black">{listaComunicados.length}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <Eye size={24} />
                    </div>
                    <TrendingUp size={20} className="text-white/60" />
                  </div>
                  <p className="text-white/80 text-sm font-bold uppercase tracking-wider mb-1">Total de Leituras</p>
                  <p className="text-4xl font-black">{metricas.historico.length}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <Flame size={24} />
                    </div>
                    <Award size={20} className="text-white/60" />
                  </div>
                  <p className="text-white/80 text-sm font-bold uppercase tracking-wider mb-1">Mais Acessado</p>
                  <p className="text-2xl font-black truncate">{metricas.ranking[0]?.acessos || 0} leituras</p>
                </div>
              </div>
            </div>

            {/* RANKING DOS MAIS ACESSADOS - ESTILO POWER BI */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-orange-500 to-red-500 p-3 rounded-2xl text-white shadow-lg shadow-orange-200">
                    <Flame size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-800">Top 5 Assuntos Mais Acessados</h2>
                    <p className="text-sm text-slate-500">Comunicados com maior engajamento da equipe</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {metricas.ranking.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl">
                    <BarChart3 className="mx-auto text-slate-300 mb-3" size={48} />
                    <p className="text-slate-400 font-medium">Ainda não há acessos registrados.</p>
                  </div>
                ) : (
                  metricas.ranking.slice(0, 5).map((item, index) => {
                    const maxAcessos = metricas.ranking[0]?.acessos || 1;
                    const porcentagem = (item.acessos / maxAcessos) * 100;
                    
                    return (
                      <div key={index} className="group hover:bg-slate-50 p-4 rounded-2xl transition-all border border-slate-100 hover:border-slate-200 hover:shadow-md">
                        <div className="flex items-center gap-4 mb-3">
                          <div className={`w-12 h-12 shrink-0 flex items-center justify-center font-black rounded-2xl text-lg shadow-lg transition-transform group-hover:scale-110 ${
                            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-orange-200' : 
                            index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-700 shadow-slate-200' : 
                            index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-amber-200' : 
                            'bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-slate-300'
                          }`}>
                            {index + 1}º
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-base text-slate-800 mb-1 truncate pr-4 group-hover:text-[#00A859] transition-colors">
                              {item.titulo}
                            </h4>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded-lg font-bold">
                                <Tag size={12}/> {item.tags}
                              </span>
                            </div>
                          </div>
                          
                          <div className="shrink-0 text-right">
                            <span className="block text-3xl font-black bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent leading-none mb-1">
                              {item.acessos}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Leituras</span>
                          </div>
                        </div>
                        
                        {/* BARRA DE PROGRESSO */}
                        <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ${
                              index === 0 ? 'bg-gradient-to-r from-orange-400 to-red-500' : 
                              index === 1 ? 'bg-gradient-to-r from-[#00A859] to-[#008C4A]' : 
                              index === 2 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 
                              'bg-gradient-to-r from-slate-400 to-slate-600'
                            }`}
                            style={{ width: `${porcentagem}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 font-bold mt-1 text-right">{porcentagem.toFixed(0)}% do total</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* AUDITORIA INDIVIDUAL - REDESENHADA */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-[#00A859] to-[#008C4A] p-3 rounded-2xl text-white shadow-lg shadow-[#00A859]/20">
                    <Users size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-800">Auditoria de Leitura Individual</h2>
                    <p className="text-sm text-slate-500">Rastreamento detalhado de cada acesso aos comunicados</p>
                  </div>
                </div>
                <div className="relative w-full md:w-80 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00A859] transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar por atendente ou comunicado..." 
                    value={buscaRelatorio} 
                    onChange={(e) => setBuscaRelatorio(e.target.value)} 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-[#00A859]/10 focus:border-[#00A859] outline-none text-sm font-medium transition-all"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gradient-to-r from-slate-50 to-slate-100 text-slate-600 font-black uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="px-6 py-4 rounded-tl-2xl">
                        <div className="flex items-center gap-2">
                          <Users size={14} />
                          Atendente
                        </div>
                      </th>
                      <th className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText size={14} />
                          Comunicado Lido
                        </div>
                      </th>
                      <th className="px-6 py-4 rounded-tr-2xl">
                        <div className="flex items-center gap-2">
                          <Clock size={14} />
                          Data e Hora
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historicoFiltrado.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="bg-slate-100 p-4 rounded-2xl">
                              <Search className="text-slate-300" size={32} />
                            </div>
                            <p className="text-slate-400 font-medium">Nenhum registro encontrado para sua busca.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      historicoFiltrado.map((log) => (
                        <tr key={log.id} className="hover:bg-[#00A859]/5/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00A859] to-[#008C4A] flex items-center justify-center text-white font-black shadow-md shadow-[#00A859]/20">
                                {(log.usuarios?.nome_completo || 'U')[0].toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 group-hover:text-[#00A859] transition-colors">
                                  {log.usuarios?.nome_completo || 'Usuário Desconhecido'}
                                </div>
                                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider bg-slate-100 px-2 py-0.5 rounded w-fit">
                                  {log.usuarios?.perfil_id || 'Atendente'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-700 truncate max-w-xs group-hover:text-[#00A859] transition-colors" title={log.comunicados_oficiais?.titulo}>
                              {log.comunicados_oficiais?.titulo || 'Comunicado Apagado'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600 font-medium">
                              <div className="bg-slate-100 p-2 rounded-lg group-hover:bg-[#00A859]/10 transition-colors">
                                <Clock size={14} className="text-slate-500 group-hover:text-[#00A859] transition-colors"/>
                              </div>
                              <div>
                                <div className="font-bold text-slate-700">
                                  {new Date(log.lido_em).toLocaleDateString('pt-BR')}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {new Date(log.lido_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {historicoFiltrado.length > 0 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                  <p className="text-slate-500 font-medium">
                    Exibindo <span className="font-bold text-slate-700">{historicoFiltrado.length}</span> registros
                  </p>
                  <p className="text-slate-400 text-xs">
                    Última atualização: {new Date().toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              )}
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
                  <span className="text-xs font-bold text-[#00A859] flex items-center gap-1.5">
                    <Tag size={14}/> {publicacaoVisualizada.tags}
                  </span>
                  {publicacaoVisualizada.modificado_por_usuario ? (
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg flex items-center gap-1">
                      ✏️ Última modificação: {publicacaoVisualizada.modificado_por_usuario.email?.split('@')[0]}
                    </span>
                  ) : publicacaoVisualizada.autor ? (
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg flex items-center gap-1">
                      👤 Publicado por: {publicacaoVisualizada.autor.email?.split('@')[0]}
                    </span>
                  ) : null}
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
                      {curtida.usuarios?.nome_completo || 'Usuário Desconhecido'}
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
                      className="group flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:border-[#00A859]400 hover:text-[#008C4A] transition-all shadow-sm hover:shadow-md"
                    >
                      <div className="bg-[#00A859]/5 p-2 rounded-lg text-[#00A859] group-hover:scale-110 transition-transform">
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

      {/* MODAL DE BOAS-VINDAS */}
      {modalBoasVindas && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#00A859]/80 to-[#008C4A]/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setModalInstrucoes(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-[#00A859]/5 flex justify-between items-start gap-4 shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-2xl text-white shadow-lg shadow-emerald-200">
                  <HelpCircle size={32} />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight">
                    Instruções de Uso - Monitoria
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
                
                {/* Seção 1: Criar Comunicados */}
                <div className="bg-gradient-to-br from-[#00A859]/5 to-[#00A859]/10 p-6 rounded-2xl border border-[#00A859]/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-[#00A859] p-2 rounded-xl text-white">
                      <Plus size={24} />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800">1. Criar e Publicar Comunicados</h3>
                  </div>
                  <ul className="space-y-3 text-slate-700">
                    <li className="flex items-start gap-3">
                      <span className="text-[#00A859] font-bold shrink-0">•</span>
                      <span><strong>Título:</strong> Digite um título claro e objetivo para o comunicado</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#00A859] font-bold shrink-0">•</span>
                      <span><strong>Conteúdo:</strong> Use o editor de texto rico com 16 fontes disponíveis, formatação (negrito, itálico, sublinhado), listas, links e imagens</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#00A859] font-bold shrink-0">•</span>
                      <span><strong>Tags:</strong> Adicione palavras-chave separadas por vírgula para facilitar a busca (ex: processos, logística, sac)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#00A859] font-bold shrink-0">•</span>
                      <span><strong>Anexos:</strong> Faça upload de arquivos (até 50MB) como PDFs, planilhas, imagens, etc.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-[#00A859] font-bold shrink-0">•</span>
                      <span><strong>Publicar:</strong> Clique em "Publicar Agora" e o comunicado ficará visível para todos os atendentes imediatamente</span>
                    </li>
                  </ul>
                </div>

                {/* Seção 2: Editar e Excluir */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-orange-600 p-2 rounded-xl text-white">
                      <Edit2 size={24} />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800">2. Editar e Excluir Comunicados</h3>
                  </div>
                  <ul className="space-y-3 text-slate-700">
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 font-bold shrink-0">•</span>
                      <span><strong>Editar:</strong> Clique no botão "Editar" em qualquer comunicado para modificar título, conteúdo, tags ou anexos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 font-bold shrink-0">•</span>
                      <span><strong>Modo de Edição:</strong> O formulário ficará destacado em laranja e o botão mudará para "Atualizar Comunicado"</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 font-bold shrink-0">•</span>
                      <span><strong>Cancelar:</strong> Use o botão "Cancelar" para sair do modo de edição sem salvar alterações</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-600 font-bold shrink-0">•</span>
                      <span><strong>Excluir:</strong> Clique em "Excluir" e confirme para remover permanentemente o comunicado</span>
                    </li>
                  </ul>
                </div>

                {/* Seção 3: Visualizar Interações */}
                <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-2xl border border-pink-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-pink-600 p-2 rounded-xl text-white">
                      <Heart size={24} />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800">3. Visualizar Interações e Curtidas</h3>
                  </div>
                  <ul className="space-y-3 text-slate-700">
                    <li className="flex items-start gap-3">
                      <span className="text-pink-600 font-bold shrink-0">•</span>
                      <span><strong>Ver Publicação:</strong> Clique em "Ver publicação e Interações" para abrir o comunicado completo</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-pink-600 font-bold shrink-0">•</span>
                      <span><strong>Curtidas:</strong> Veja quantas curtidas o comunicado recebeu e quem curtiu (lista de nomes)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-pink-600 font-bold shrink-0">•</span>
                      <span><strong>Anexos:</strong> Baixe os arquivos anexados clicando nos links na parte inferior do modal</span>
                    </li>
                  </ul>
                </div>

                {/* Seção 4: Relatórios */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-purple-600 p-2 rounded-xl text-white">
                      <BarChart3 size={24} />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800">4. Relatórios e Análises</h3>
                  </div>
                  <ul className="space-y-3 text-slate-700">
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold shrink-0">•</span>
                      <span><strong>Cards de Métricas:</strong> Veja total de comunicados, total de leituras e comunicado mais acessado</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold shrink-0">•</span>
                      <span><strong>Top 5 Mais Acessados:</strong> Ranking visual com barras de progresso mostrando os comunicados mais lidos</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold shrink-0">•</span>
                      <span><strong>Auditoria Individual:</strong> Tabela completa mostrando quem leu cada comunicado, quando e qual horário</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold shrink-0">•</span>
                      <span><strong>Buscar:</strong> Use o campo de busca para filtrar por nome de atendente ou título do comunicado</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-purple-600 font-bold shrink-0">•</span>
                      <span><strong>Baixar Relatório:</strong> Clique em "Baixar Relatório (CSV)" para exportar todos os dados para Excel</span>
                    </li>
                  </ul>
                </div>

                {/* Seção 5: Busca */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-slate-600 p-2 rounded-xl text-white">
                      <Search size={24} />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800">5. Buscar Comunicados</h3>
                  </div>
                  <ul className="space-y-3 text-slate-700">
                    <li className="flex items-start gap-3">
                      <span className="text-slate-600 font-bold shrink-0">•</span>
                      <span><strong>Campo de Busca:</strong> Digite palavras-chave no campo "Pesquisar por título ou tag..."</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-slate-600 font-bold shrink-0">•</span>
                      <span><strong>Filtro em Tempo Real:</strong> Os resultados são filtrados automaticamente conforme você digita</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-slate-600 font-bold shrink-0">•</span>
                      <span><strong>Busca por Título ou Tag:</strong> A busca funciona tanto no título quanto nas tags dos comunicados</span>
                    </li>
                  </ul>
                </div>

                {/* Dicas Importantes */}
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-2xl border-2 border-yellow-300">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">💡</span>
                    <h3 className="text-xl font-extrabold text-slate-800">Dicas Importantes</h3>
                  </div>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">✓</span>
                      <span>Use títulos descritivos para facilitar a busca dos atendentes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">✓</span>
                      <span>Adicione sempre tags relevantes para melhorar a organização</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">✓</span>
                      <span>Revise o conteúdo antes de publicar - todos os atendentes verão imediatamente</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">✓</span>
                      <span>Monitore os relatórios mensalmente para identificar conteúdos mais relevantes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-600 font-bold">✓</span>
                      <span>Baixe o relatório CSV no final de cada mês para histórico</span>
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