import { useState, useEffect, useCallback, useRef } from 'react';
import DOMPurify from 'dompurify';
import ReactQuill from 'react-quill-new';
import { 
  Plus, Search, Edit2, Trash2, X, Save, 
  Paperclip, Tag, FileText, Calendar, AlertCircle, CheckCircle2,
  BarChart3, Flame, Clock, Users, LogOut, Heart, Download, TrendingUp, Eye, Award, HelpCircle, Palette
} from 'lucide-react';

import 'react-quill-new/dist/quill.snow.css';
import { comunicadosService, relatoriosService } from '../services/api';
import backgroundImage from '../assets/telainiciaMonitoria .png';
import { usePersonalizacao } from '../hooks/usePersonalizacao';
import PainelPersonalizacao from '../components/PainelPersonalizacao';
import UploadMidia from '../components/UploadMidia';
import ModalVideo from '../components/ModalVideo';
import { usePastas } from '../hooks/usePastas';
import EditorConteudo from '../components/EditorConteudo';

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

// ── Registrar formato de imagem com suporte a width/height ──────────────────
const BaseImage = ReactQuill.Quill.import('formats/image');
class ResizableImage extends BaseImage {
  static create(value) {
    const node = super.create(value);
    if (typeof value === 'object') {
      node.setAttribute('src', value.src || value);
      if (value.width) node.setAttribute('width', value.width);
      if (value.height) node.setAttribute('height', value.height);
      if (value.style) node.setAttribute('style', value.style);
    }
    return node;
  }

  static value(node) {
    return {
      src: node.getAttribute('src'),
      width: node.getAttribute('width'),
      height: node.getAttribute('height'),
      style: node.getAttribute('style'),
    };
  }

  static formats(node) {
    const formats = {};
    if (node.hasAttribute('width')) formats.width = node.getAttribute('width');
    if (node.hasAttribute('height')) formats.height = node.getAttribute('height');
    if (node.hasAttribute('style')) formats.style = node.getAttribute('style');
    return formats;
  }

  format(name, value) {
    if (name === 'width' || name === 'height' || name === 'style') {
      if (value) {
        this.domNode.setAttribute(name, value);
      } else {
        this.domNode.removeAttribute(name);
      }
    } else {
      super.format(name, value);
    }
  }
}
ResizableImage.blotName = 'image';
ResizableImage.tagName = 'IMG';
ReactQuill.Quill.register(ResizableImage, true);

// Configuração do Toolbar (mantida para compatibilidade com estilos CSS)
// eslint-disable-next-line no-unused-vars
const _modulosQuill = {
  toolbar: {
    container: [
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
      ['link', 'image', 'video'],
      ['clean']
    ],
    handlers: {}
  },
};

// ─── Componente de Pastas para Monitoria (com mover/reordenar/editar/excluir) ──
function PastasMonitoria({ pastasOrganizadas, pastas, cor, criarPasta, renomearPasta, excluirPasta, reordenarPastas, moverParaPasta, reordenarItem, getPastaDoComunicado, onVer, onEditar, onDeletar }) {
  const [novaPasta, setNovaPasta] = useState('');
  const [moverItem, setMoverItem] = useState(null);
  const [editandoPasta, setEditandoPasta] = useState(null);
  const [nomeEditando, setNomeEditando] = useState('');

  return (
    <div className="space-y-4">
      {/* Criar pasta */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
        <span className="text-lg">📁</span>
        <input type="text" value={novaPasta} onChange={e => setNovaPasta(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && novaPasta.trim()) { criarPasta(novaPasta.trim()); setNovaPasta(''); } }}
          placeholder="Nova pasta... (Enter para criar)"
          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 transition-all"
        />
        <button onClick={() => { if (novaPasta.trim()) { criarPasta(novaPasta.trim()); setNovaPasta(''); } }}
          disabled={!novaPasta.trim()} className="px-3 py-2 text-xs font-bold text-white rounded-xl disabled:opacity-40" style={{ background: cor }}
        >+ Criar</button>
      </div>

      {/* Modal mover */}
      {moverItem && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in" onClick={() => setMoverItem(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <h3 className="font-extrabold text-slate-800 mb-1">Mover para pasta</h3>
            <p className="text-xs text-slate-500 mb-4 truncate">"{moverItem.titulo}"</p>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {pastas.map(p => (
                <button key={p.id} onClick={() => { moverParaPasta(moverItem.id, p.id); setMoverItem(null); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all hover:bg-slate-50 border border-slate-100"
                >
                  <span className="text-lg">📁</span>
                  <span className="font-bold text-sm text-slate-700 flex-1">{p.nome}</span>
                  {getPastaDoComunicado(moverItem.id) === p.id && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: cor }}>Atual</span>
                  )}
                </button>
              ))}
            </div>
            <button onClick={() => setMoverItem(null)} className="w-full mt-3 py-2.5 text-sm font-bold text-slate-500 bg-slate-100 rounded-xl">Cancelar</button>
          </div>
        </div>
      )}

      {/* Pastas */}
      {pastasOrganizadas.map(({ pasta, itens }) => (
        <details key={pasta.id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" open>
          <summary className="flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 cursor-pointer select-none hover:bg-slate-50 transition-colors list-none">
            {pasta.id !== '__geral__' && (
              <div className="flex flex-col gap-0.5 shrink-0">
                <button onClick={(e) => { e.preventDefault(); reordenarPastas(pasta.id, 'up'); }} className="text-slate-300 hover:text-slate-600 p-0.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-8 8h16z"/></svg>
                </button>
                <button onClick={(e) => { e.preventDefault(); reordenarPastas(pasta.id, 'down'); }} className="text-slate-300 hover:text-slate-600 p-0.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l8-8H4z"/></svg>
                </button>
              </div>
            )}
            <span className="text-lg shrink-0">📁</span>
            {editandoPasta === pasta.id ? (
              <input autoFocus value={nomeEditando} onChange={e => setNomeEditando(e.target.value)}
                onBlur={() => { if (nomeEditando.trim()) renomearPasta(pasta.id, nomeEditando.trim()); setEditandoPasta(null); }}
                onKeyDown={e => { if (e.key === 'Enter') { if (nomeEditando.trim()) renomearPasta(pasta.id, nomeEditando.trim()); setEditandoPasta(null); } }}
                className="flex-1 px-2 py-1 text-sm font-bold bg-slate-50 border border-slate-200 rounded-lg outline-none"
                onClick={e => e.preventDefault()}
              />
            ) : (
              <span className="font-extrabold text-slate-800 flex-1 min-w-0 truncate">{pasta.nome}</span>
            )}
            <span className="text-xs font-black px-2 py-0.5 rounded-full text-white shrink-0" style={{ background: cor }}>{itens.length}</span>
            {pasta.id !== '__geral__' && (
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={(e) => { e.preventDefault(); setEditandoPasta(pasta.id); setNomeEditando(pasta.nome); }} className="p-1 text-slate-400 hover:text-blue-500 rounded" title="Renomear">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onClick={(e) => { e.preventDefault(); if (window.confirm(`Excluir pasta "${pasta.nome}"?`)) excluirPasta(pasta.id); }} className="p-1 text-slate-400 hover:text-red-500 rounded" title="Excluir">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                </button>
              </div>
            )}
            <svg className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </summary>
          <div className="divide-y divide-slate-50 border-t border-slate-100">
            {itens.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6 italic">Pasta vazia</p>
            ) : itens.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2 px-4 sm:px-5 py-3 hover:bg-slate-50 transition-colors group">
                <div className="flex flex-col gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => reordenarItem(pasta.id, c.id, 'up', itens.map(x => x.id))} className="text-slate-300 hover:text-slate-600 p-0.5">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4l-8 8h16z"/></svg>
                  </button>
                  <button onClick={() => reordenarItem(pasta.id, c.id, 'down', itens.map(x => x.id))} className="text-slate-300 hover:text-slate-600 p-0.5">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20l8-8H4z"/></svg>
                  </button>
                </div>
                <span className="text-xs font-black text-slate-300 w-4 text-right shrink-0">{i + 1}</span>
                <div className="w-0.5 h-4 rounded-full shrink-0" style={{ background: cor + '60' }} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-800 truncate">{c.titulo}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400">{new Date(c.criado_em).toLocaleDateString('pt-BR')}</span>
                    <span className="text-[10px] text-red-400 flex items-center gap-0.5"><Heart size={9} className="fill-current"/> {c.curtidas_comunicados?.length || 0}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setMoverItem({ id: c.id, titulo: c.titulo })} className="p-1.5 text-slate-400 hover:text-blue-500 bg-slate-50 rounded-lg" title="Mover">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
                  </button>
                  <button onClick={() => onVer(c)} className="px-2 py-1.5 text-xs font-bold text-white rounded-lg" style={{ background: cor }}>Ver</button>
                  <button onClick={() => onEditar(c)} className="p-1.5 text-orange-500 bg-orange-50 rounded-lg hover:bg-orange-100"><Edit2 size={12}/></button>
                  <button onClick={() => onDeletar(c.id)} className="p-1.5 text-red-500 bg-red-50 rounded-lg hover:bg-red-100"><Trash2 size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

export default function DashboardMonitoria() {
  const personalizacao = usePersonalizacao('monitoria');
  const { rascunho, painelAberto, setPainelAberto, getEstilo, classeAnimacao, classeMinimalista, classeTema } = personalizacao;

  const [abaAtiva, setAbaAtiva] = useState('comunicados');

  const layoutAtual = rascunho.modeFoco ? 'foco' : (rascunho.layout || 'cards');
  const pastasHook = usePastas();

  const [modalVideoAberto, setModalVideoAberto] = useState(false);
  const [editorVisualAberto, setEditorVisualAberto] = useState(false);
  const [previewAberto, setPreviewAberto] = useState(false);
  const editorFileRef = useRef(null);

  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [tags, setTags] = useState('');
  const [categoria, setCategoria] = useState('');
  const [dicas, setDicas] = useState([{ tipo: 'atencao', texto: '' }]); // dicas de atenção
  const [arquivos, setArquivos] = useState(null);
  const [idEmEdicao, setIdEmEdicao] = useState(null);
  const [midias, setMidias] = useState([]);
  
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

  // Boas-vindas (primeiro acesso)
  const [modalBoasVindas, setModalBoasVindas] = useState(false);
  const [etapaBoasVindas, setEtapaBoasVindas] = useState('pergunta'); // 'pergunta' ou 'saudacao'
  const [nomePreferido, setNomePreferido] = useState('');
  const [tratamento, setTratamento] = useState(''); // 'masculino' ou 'feminino'

  const [modalInstrucoes, setModalInstrucoes] = useState(false);

  useEffect(() => {
    const jaConfigurou = localStorage.getItem('usuario_configurado');
    
    if (!jaConfigurou) {
      setModalBoasVindas(true);
      setEtapaBoasVindas('pergunta');
    } else {
      setNomePreferido(localStorage.getItem('nome_preferido') || '');
      setTratamento(localStorage.getItem('tratamento') || '');
    }
  }, []);

  const obterSaudacao = () => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return 'Bom dia';
    if (hora >= 12 && hora < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const confirmarNome = () => {
    if (!nomePreferido.trim() || !tratamento) {
      mostrarMensagem('Por favor, preencha seu nome e selecione como prefere ser tratado(a)', 'erro');
      return;
    }
    
    localStorage.setItem('nome_preferido', nomePreferido);
    localStorage.setItem('tratamento', tratamento);
    localStorage.setItem('usuario_configurado', 'true');
    
    setEtapaBoasVindas('saudacao');
  };

  const fecharBoasVindas = () => {
    setModalBoasVindas(false);
    setEtapaBoasVindas('pergunta');
    setNomePreferido('');
    setTratamento('');
  };

  const downloadRelatorio = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Posição,Título,Tags,Total de Acessos\n";
      
      metricas.ranking.slice(0, 5).forEach((item, index) => {
        csvContent += `${index + 1}º,"${item.titulo}","${item.tags}",${item.acessos}\n`;
      });
      
      csvContent += "\n\nAtendente,Comunicado Lido,Data e Hora\n";
      
      metricas.historico.forEach((log) => {
        const nomeAtendente = log.usuarios?.nome_completo || 'Usuário Desconhecido';
        const titulo = log.comunicados_oficiais?.titulo || 'Comunicado Apagado';
        const dataHora = `${new Date(log.lido_em).toLocaleDateString('pt-BR')} ${new Date(log.lido_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        csvContent += `"${nomeAtendente}","${titulo}","${dataHora}"\n`;
      });

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
    const decoded = txt.value;
    return DOMPurify.sanitize(decoded, {
      ALLOWED_TAGS: ['p','br','strong','em','u','s','h1','h2','h3','h4','h5','h6','ul','ol','li','a','img','blockquote','code','pre','span','div','iframe','table','thead','tbody','tr','th','td','sub','sup','hr'],
      ALLOWED_ATTR: ['href','src','alt','title','class','style','target','width','height','allowfullscreen','frameborder','rel','colspan','rowspan'],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script','object','embed','form','input','textarea','button'],
      FORBID_ATTR: ['onerror','onload','onclick','onmouseover','onfocus','onblur'],
    });
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
    setCategoria('');
    setDicas([{ tipo: 'atencao', texto: '' }]);
    setArquivos(null);
    setMidias([]);
    setIdEmEdicao(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSalvarComunicado = async (e) => {
    e.preventDefault();
    setCarregando(true);

    try {
      const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('tags', tags);

      const dicasValidas = dicas.filter(d => d.texto.trim());
      let conteudoFinal = conteudo;

      if (dicasValidas.length > 0) {
        const CORES_DICA = {
          atencao:  { bg: '#fffbeb', borda: '#f59e0b', icone: '⚠️', titulo: 'Atenção' },
          importante: { bg: '#fef2f2', borda: '#ef4444', icone: '🚨', titulo: 'Importante' },
          info:     { bg: '#eff6ff', borda: '#3b82f6', icone: 'ℹ️', titulo: 'Informação' },
          dica:     { bg: '#f0fdf4', borda: '#22c55e', icone: '💡', titulo: 'Dica' },
        };
        const dicasHTML = dicasValidas.map(d => {
          const c = CORES_DICA[d.tipo] || CORES_DICA.atencao;
          return `<div style="background:${c.bg};border-left:4px solid ${c.borda};border-radius:8px;padding:12px 16px;margin:12px 0;display:flex;gap:10px;align-items:flex-start;">
            <span style="font-size:18px;line-height:1.4;">${c.icone}</span>
            <div><strong style="color:#1e293b;font-size:13px;">${c.titulo}:</strong><p style="margin:4px 0 0;color:#334155;font-size:13px;line-height:1.6;">${d.texto}</p></div>
          </div>`;
        }).join('');
        conteudoFinal = dicasHTML + conteudo;
      }

      // YouTube links embutidos no conteúdo
      const youtubeLinks = midias.filter(m => m.tipo === 'youtube');
      if (youtubeLinks.length > 0) {
        const iframes = youtubeLinks.map(m =>
          `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:16px 0;border-radius:12px;"><iframe src="https://www.youtube.com/embed/${m.youtubeId}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:12px;" allowfullscreen></iframe></div>`
        ).join('');
        conteudoFinal = conteudoFinal + iframes;
      }

      formData.append('conteudo', conteudoFinal);

      // Categoria como tag especial (prefixo "cat:")
      const tagsFinais = categoria.trim()
        ? `${tags}${tags ? ', ' : ''}cat:${categoria.trim()}`
        : tags;
      formData.set('tags', tagsFinais);

      if (arquivos) {
        Array.from(arquivos).forEach(arq => formData.append('arquivos', arq));
      }
      midias.filter(m => m.tipo === 'arquivo' && m.arquivo).forEach(m => {
        formData.append('arquivos', m.arquivo);
      });

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
    <div className={`min-h-screen p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 tv:p-16 font-sans relative ${classeAnimacao} ${classeMinimalista} ${classeTema}`} style={getEstilo(backgroundImage)}>
      {painelAberto && (
        <PainelPersonalizacao
          {...personalizacao}
          onFechar={() => setPainelAberto(false)}
        />
      )}
      <div className="max-w-5xl xl:max-w-6xl 2xl:max-w-7xl tv:max-w-[100rem] mx-auto space-y-8 tv:space-y-12">

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

        /* ── IMAGENS REDIMENSIONÁVEIS NO EDITOR ── */
        .form-editor .ql-editor img {
          cursor: nwse-resize !important;
          resize: both !important;
          overflow: hidden !important;
          display: inline-block !important;
          max-width: 100% !important;
          border: 2px solid transparent !important;
          border-radius: 8px !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
          min-width: 50px !important;
          min-height: 50px !important;
        }
        .form-editor .ql-editor img:hover {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
        }
        .form-editor .ql-editor img:active,
        .form-editor .ql-editor img:focus {
          border-color: #1d4ed8 !important;
          box-shadow: 0 0 0 4px rgba(29, 78, 216, 0.2) !important;
          outline: 2px dashed #3b82f6 !important;
          outline-offset: 3px !important;
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
        
        /* Imagens — respeita o tamanho definido na edição */
        .modal-leitura .ql-editor img {
          max-width: 100%;
          border-radius: 8px;
          margin: 1em auto;
          display: block;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          object-fit: contain;
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
        
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1 sm:mb-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl tv:text-5xl font-extrabold tracking-tight text-slate-800 flex flex-wrap items-center gap-2">
                {nomePreferido ? (
                  <>
                    {obterSaudacao()}, {nomePreferido}!
                    {tratamento && (
                      <span className="ml-1 sm:ml-2 text-xl sm:text-2xl tv:text-4xl">
                        {tratamento === 'feminino' ? '👩‍💼' : '👨‍💼'}
                      </span>
                    )}
                  </>
                ) : (
                  'Dashboard Monitoria'
                )}
              </h1>
            </div>
            <p className="text-slate-600 font-medium mb-0.5 sm:mb-1 text-sm sm:text-base tv:text-xl">
              Aqui é o seu dashboard de Monitoria
            </p>
            <p className="text-slate-500 text-xs sm:text-sm tv:text-lg hidden sm:block">
              Você pode publicar qualquer conteúdo e todos os usuários cadastrados irão ver
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => setPainelAberto(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 tv:py-3 tv:px-6 tv:text-lg text-white text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95"
                style={{ background: `linear-gradient(135deg, ${rascunho.corPrimaria}, ${rascunho.corSecundaria})`, boxShadow: `0 4px 15px ${rascunho.corPrimaria}40` }}
              >
                <Palette size={16} /> <span className="hidden sm:inline">Personalize</span>
              </button>
              <button 
                onClick={() => setModalInstrucoes(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 tv:py-3 tv:px-6 tv:text-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 active:scale-95"
              >
                <HelpCircle size={18} /> <span className="hidden sm:inline">Instruções de Uso</span><span className="sm:hidden">Ajuda</span>
              </button>
              <span className="hidden lg:inline-block bg-[#00A859]/5 text-[#008C4A] text-xs font-bold px-3 py-1 rounded-full border border-[#00A859]/20">
                PAINEL ADMINISTRATIVO
              </span>
              <button onClick={() => setModalLogoutAberto(true)} className="flex items-center gap-2 px-3 sm:px-4 py-2 tv:py-3 tv:px-6 tv:text-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-red-200 hover:shadow-xl hover:shadow-red-300 active:scale-95">
                <LogOut size={16} /> <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
            <div className="flex gap-1 sm:gap-2 p-1 bg-white/80 backdrop-blur-sm rounded-2xl w-fit shadow-lg border border-slate-200 overflow-x-auto hide-scrollbar max-w-full">
              <button onClick={() => setAbaAtiva('comunicados')}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 lg:px-6 tv:px-8 py-2 sm:py-2.5 tv:py-4 rounded-xl font-bold text-xs sm:text-sm tv:text-base transition-all whitespace-nowrap"
                style={abaAtiva === 'comunicados' ? { background: `linear-gradient(135deg, ${rascunho.corPrimaria}, ${rascunho.corSecundaria})`, color: '#fff' } : { color: '#475569' }}
              >
                <FileText size={15} className="sm:hidden"/><FileText size={16} className="hidden sm:block"/> Comunicados
              </button>
              <button onClick={() => setAbaAtiva('relatorios')}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 lg:px-6 tv:px-8 py-2 sm:py-2.5 tv:py-4 rounded-xl font-bold text-xs sm:text-sm tv:text-base transition-all whitespace-nowrap"
                style={abaAtiva === 'relatorios' ? { background: `linear-gradient(135deg, ${rascunho.corPrimaria}, ${rascunho.corSecundaria})`, color: '#fff' } : { color: '#475569' }}
              >
                <BarChart3 size={15} className="sm:hidden"/><BarChart3 size={16} className="hidden sm:block"/> Relatórios
              </button>
            </div>
          </div>
        </header>

        {abaAtiva === 'comunicados' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            {/* FORMULÁRIO DE PUBLICAÇÃO */}
            <section className={`bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 transition-all duration-500 ${idEmEdicao ? 'ring-2 ring-orange-400' : ''}`}>
              <div className="p-1 border-b border-slate-50 bg-slate-50/50">
                <div className={`px-6 py-3 flex items-center gap-2 font-bold text-sm ${idEmEdicao ? 'text-orange-600' : ''}`}
                  style={!idEmEdicao ? { color: rascunho.corPrimaria } : {}}
                >
                  {idEmEdicao ? <Edit2 size={16}/> : <Plus size={16}/>}
                  {idEmEdicao ? 'MODO DE EDIÇÃO' : 'NOVA PUBLICAÇÃO'}
                </div>
              </div>

              <form onSubmit={handleSalvarComunicado} className="p-4 sm:p-6 md:p-8 tv:p-12 space-y-5 sm:space-y-6">
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
                    <div className="rounded-2xl border border-slate-200 overflow-hidden transition-all bg-white shadow-sm">
                      <EditorConteudo
                        value={conteudo}
                        onChange={setConteudo}
                        height={450}
                        onVideoClick={() => setModalVideoAberto(true)}
                      />
                    </div>

                    {/* Botão para inserir dica/destaque no conteúdo */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const tipoSelecionado = prompt('Tipo de dica:\n1 - ⚠️ Atenção\n2 - 🚨 Importante\n3 - ℹ️ Informação\n4 - 💡 Dica\n\nDigite o número:');
                          const texto = prompt('Texto da dica:');
                          if (!texto?.trim()) return;
                          const tipos = {
                            '1': { bg: '#fffbeb', borda: '#f59e0b', icone: '⚠️', titulo: 'Atenção' },
                            '2': { bg: '#fef2f2', borda: '#ef4444', icone: '🚨', titulo: 'Importante' },
                            '3': { bg: '#eff6ff', borda: '#3b82f6', icone: 'ℹ️', titulo: 'Informação' },
                            '4': { bg: '#f0fdf4', borda: '#22c55e', icone: '💡', titulo: 'Dica' },
                          };
                          const t = tipos[tipoSelecionado] || tipos['1'];
                          const dicaHtml = `<div style="background:${t.bg};border-left:4px solid ${t.borda};border-radius:8px;padding:12px 16px;margin:12px 0;display:flex;gap:10px;align-items:flex-start;"><span style="font-size:18px;line-height:1.4;">${t.icone}</span><div><strong style="color:#1e293b;font-size:13px;">${t.titulo}:</strong><p style="margin:4px 0 0;color:#334155;font-size:13px;line-height:1.6;">${texto.trim()}</p></div></div>`;
                          setConteudo(prev => prev + dicaHtml);
                          mostrarMensagem(`Dica "${t.titulo}" inserida no conteúdo!`);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl transition-all active:scale-95 border"
                        style={{ borderColor: '#f59e0b60', background: '#fffbeb', color: '#92400e' }}
                      >
                        💡 Inserir dica/destaque
                      </button>
                    </div>

                    {/* Botão para abrir/fechar o editor visual inline */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setEditorVisualAberto(v => !v)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all active:scale-95"
                        style={{
                          background: editorVisualAberto ? rascunho.corPrimaria : rascunho.corPrimaria + '15',
                          color: editorVisualAberto ? '#fff' : rascunho.corPrimaria,
                        }}
                      >
                        🎨 {editorVisualAberto ? 'Fechar Editor Visual' : 'Abrir Editor Visual (Polotno)'}
                      </button>
                      {editorVisualAberto && (
                        <span className="text-xs text-slate-500">
                          Crie o design → Baixe → Faça upload abaixo → A imagem vai direto para o conteúdo
                        </span>
                      )}
                    </div>

                    {/* Editor Polotno inline + upload direto para o conteúdo */}
                    {editorVisualAberto && (
                      <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                        {/* Upload da imagem do design → insere no conteúdo */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                          <button
                            type="button"
                            onClick={() => editorFileRef.current?.click()}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all active:scale-95"
                            style={{ background: rascunho.corPrimaria, color: '#fff' }}
                          >
                            ⬆️ Upload da imagem do design (insere no conteúdo)
                          </button>
                          <input
                            ref={editorFileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const imgHtml = `<div style="text-align:center;margin:16px 0;"><img src="${ev.target.result}" alt="Design visual" style="max-width:100%;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.08);" /></div>`;
                                setConteudo(prev => prev + imgHtml);
                                mostrarMensagem('✅ Imagem do design inserida no conteúdo!');
                              };
                              reader.readAsDataURL(file);
                              e.target.value = '';
                            }}
                          />
                          <p className="text-xs text-emerald-700 flex-1">
                            💡 Baixe o design no Polotno (botão "Baixar" azul) → Depois clique aqui para inserir a imagem direto no comunicado
                          </p>
                        </div>

                        {/* Iframe do Polotno */}
                        <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg" style={{ height: '500px' }}>
                          <iframe
                            src="https://studio.polotno.com"
                            className="w-full h-full border-0"
                            title="Editor Visual Polotno"
                            allow="clipboard-read; clipboard-write"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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

                  {/* ── Categoria (visível quando organização = pastas) ── */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center gap-2">
                      📁 Categoria / Pasta
                      {(rascunho.organizacao || 'livre') !== 'pastas' && (
                        <span className="text-[10px] font-medium text-slate-400 normal-case">(ative "Pastas" em Personalizar → Layout para organizar por categoria)</span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={categoria}
                      onChange={e => setCategoria(e.target.value)}
                      placeholder="Ex: Processos, SAC, Crédito, RH..."
                      className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#00A859]/10 focus:border-[#00A859] transition-all outline-none border text-sm"
                    />
                  </div>
                </div>

                <UploadMidia
                  midias={midias}
                  onChange={setMidias}
                  corPrimaria={rascunho.corPrimaria}
                />

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  {/* Botão Visualizar antes de publicar */}
                  <button
                    type="button"
                    onClick={() => setPreviewAberto(true)}
                    disabled={!conteudo.trim() && !titulo.trim()}
                    className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-4 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] border border-blue-200 disabled:opacity-40"
                  >
                    <Eye size={18}/> Visualizar antes de publicar
                  </button>

                  <button 
                    type="submit" 
                    disabled={carregando}
                    className={`flex-1 flex items-center justify-center gap-2 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-70 ${idEmEdicao ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-200' : ''}`}
                    style={!idEmEdicao ? { background: `linear-gradient(135deg, ${rascunho.corPrimaria}, ${rascunho.corSecundaria})` } : {}}
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
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Histórico de Publicações</h2>
                  <p className="text-slate-500 text-sm">Visualize e gerencie os conteúdos existentes.</p>
                </div>
                
                <div className="relative w-full sm:w-72 md:w-80 tv:w-[28rem] group">
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
              
              {/* ── LISTAGEM ADAPTATIVA POR LAYOUT ── */}
              {comunicadosFiltrados.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                  <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="text-slate-300" size={32} />
                  </div>
                  <p className="text-slate-400 font-medium italic">Nenhum registro encontrado para sua busca.</p>
                </div>
              ) : (rascunho.organizacao || 'livre') === 'pastas' ? (
                /* PASTAS — usa o hook usePastas com mover/reordenar */
                (() => {
                  const { pastas, criarPasta, renomearPasta, excluirPasta, reordenarPastas, moverParaPasta, reordenarItem, organizarEmPastas, getPastaDoComunicado } = pastasHook;
                  const pastasOrganizadas = organizarEmPastas(comunicadosFiltrados);

                  return (
                    <PastasMonitoria
                      pastasOrganizadas={pastasOrganizadas}
                      pastas={pastas}
                      cor={rascunho.corPrimaria}
                      criarPasta={criarPasta}
                      renomearPasta={renomearPasta}
                      excluirPasta={excluirPasta}
                      reordenarPastas={reordenarPastas}
                      moverParaPasta={moverParaPasta}
                      reordenarItem={reordenarItem}
                      getPastaDoComunicado={getPastaDoComunicado}
                      onVer={setPublicacaoVisualizada}
                      onEditar={carregarParaEdicao}
                      onDeletar={handleDeletarComunicado}
                    />
                  );
                })()
              ) : layoutAtual === 'lista' ? (
                /* LISTA — linhas compactas com ações inline */
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm divide-y divide-slate-100">
                  {comunicadosFiltrados.map(c => (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group">
                      <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: rascunho.corPrimaria }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-800 truncate">{c.titulo}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                          <Calendar size={11}/> {new Date(c.criado_em).toLocaleDateString('pt-BR')}
                          <span className="px-1.5 py-0.5 rounded font-bold" style={{ color: rascunho.corPrimaria, background: rascunho.corPrimaria + '15' }}>{c.tags}</span>
                          <span className="text-red-400 flex items-center gap-0.5"><Heart size={10} className="fill-current"/> {c.curtidas_comunicados?.length || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => setPublicacaoVisualizada(c)} className="px-2.5 py-1.5 text-xs font-bold text-white rounded-lg" style={{ background: rascunho.corPrimaria }}>Ver</button>
                        <button onClick={() => carregarParaEdicao(c)} className="p-1.5 text-orange-500 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"><Edit2 size={13}/></button>
                        <button onClick={() => handleDeletarComunicado(c.id)} className="p-1.5 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={13}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : layoutAtual === 'kanban' ? (
                /* KANBAN — colunas por data */
                <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                  {[
                    { label: '🆕 Recentes', dias: 3 },
                    { label: '📅 Esta semana', dias: 7 },
                    { label: '📦 Anteriores', dias: Infinity },
                  ].map((col, colIdx) => {
                    const anterior = [0, 3, 7][colIdx];
                    const items = comunicadosFiltrados.filter(c => {
                      const dias = (Date.now() - new Date(c.criado_em)) / 86400000;
                      return dias >= anterior && dias < col.dias;
                    });
                    return (
                      <div key={col.label} className="shrink-0 w-72">
                        <div className="flex items-center justify-between mb-3 px-1">
                          <span className="font-extrabold text-sm text-slate-700">{col.label}</span>
                          <span className="text-xs font-black px-2 py-0.5 rounded-full text-white" style={{ background: rascunho.corPrimaria }}>{items.length}</span>
                        </div>
                        <div className="space-y-2">
                          {items.length === 0 ? (
                            <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">Nenhum item</div>
                          ) : items.map(c => (
                            <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all">
                              <h4 className="font-bold text-sm text-slate-800 mb-2 line-clamp-2">{c.titulo}</h4>
                              <div className="flex flex-wrap gap-1 mb-3">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: rascunho.corPrimaria, background: rascunho.corPrimaria + '15' }}>{c.tags}</span>
                                <span className="text-[10px] text-red-400 font-bold flex items-center gap-0.5"><Heart size={9} className="fill-current"/> {c.curtidas_comunicados?.length || 0}</span>
                              </div>
                              <div className="flex gap-1.5">
                                <button onClick={() => setPublicacaoVisualizada(c)} className="flex-1 py-1.5 text-[10px] font-bold text-white rounded-lg" style={{ background: rascunho.corPrimaria }}>Ver</button>
                                <button onClick={() => carregarParaEdicao(c)} className="p-1.5 text-orange-500 bg-orange-50 rounded-lg"><Edit2 size={11}/></button>
                                <button onClick={() => handleDeletarComunicado(c.id)} className="p-1.5 text-red-500 bg-red-50 rounded-lg"><Trash2 size={11}/></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : layoutAtual === 'compacto' ? (
                /* COMPACTO — máxima densidade */
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                  {comunicadosFiltrados.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-black text-slate-300 w-5 text-right shrink-0">{i + 1}</span>
                      <div className="w-0.5 h-4 rounded-full shrink-0" style={{ background: rascunho.corPrimaria }} />
                      <p className="flex-1 text-sm font-semibold text-slate-700 truncate">{c.titulo}</p>
                      <span className="text-[10px] text-slate-400 hidden sm:block">{new Date(c.criado_em).toLocaleDateString('pt-BR')}</span>
                      <span className="text-[10px] text-red-400 flex items-center gap-0.5"><Heart size={9} className="fill-current"/> {c.curtidas_comunicados?.length || 0}</span>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => setPublicacaoVisualizada(c)} className="px-2 py-1 text-[10px] font-bold text-white rounded-lg" style={{ background: rascunho.corPrimaria }}>Ver</button>
                        <button onClick={() => carregarParaEdicao(c)} className="p-1 text-orange-500 bg-orange-50 rounded-lg"><Edit2 size={11}/></button>
                        <button onClick={() => handleDeletarComunicado(c.id)} className="p-1 text-red-500 bg-red-50 rounded-lg"><Trash2 size={11}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : layoutAtual === 'magazine' ? (
                /* MAGAZINE — destaque + grade */
                <div className="space-y-4">
                  {/* Destaque */}
                  {comunicadosFiltrados[0] && (() => {
                    const c = comunicadosFiltrados[0];
                    return (
                      <div className="bg-white rounded-3xl border-2 overflow-hidden shadow-lg p-6 sm:p-8 relative" style={{ borderColor: rascunho.corPrimaria }}>
                        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${rascunho.corPrimaria}, ${rascunho.corSecundaria})` }} />
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <span className="text-[10px] font-black px-2 py-1 rounded-full text-white" style={{ background: rascunho.corPrimaria }}>⭐ Destaque</span>
                          <div className="flex gap-2">
                            <button onClick={() => carregarParaEdicao(c)} className="p-2 text-orange-500 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"><Edit2 size={14}/></button>
                            <button onClick={() => handleDeletarComunicado(c.id)} className="p-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={14}/></button>
                          </div>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 mb-3">{c.titulo}</h2>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Calendar size={12}/> {new Date(c.criado_em).toLocaleDateString('pt-BR')}</span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ color: rascunho.corPrimaria, background: rascunho.corPrimaria + '15' }}>{c.tags}</span>
                          <span className="text-xs text-red-400 font-bold flex items-center gap-1"><Heart size={11} className="fill-current"/> {c.curtidas_comunicados?.length || 0}</span>
                        </div>
                        <button onClick={() => setPublicacaoVisualizada(c)} className="inline-flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded-xl shadow-lg" style={{ background: `linear-gradient(135deg, ${rascunho.corPrimaria}, ${rascunho.corSecundaria})` }}>
                          <FileText size={15}/> Ver publicação e Interações
                        </button>
                      </div>
                    );
                  })()}
                  {/* Grade dos demais */}
                  {comunicadosFiltrados.length > 1 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {comunicadosFiltrados.slice(1).map(c => (
                        <div key={c.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-all">
                          <h4 className="font-bold text-sm text-slate-800 mb-2 line-clamp-2">{c.titulo}</h4>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: rascunho.corPrimaria, background: rascunho.corPrimaria + '15' }}>{c.tags}</span>
                            <div className="flex gap-1">
                              <button onClick={() => setPublicacaoVisualizada(c)} className="px-2 py-1 text-[10px] font-bold text-white rounded-lg" style={{ background: rascunho.corPrimaria }}>Ver</button>
                              <button onClick={() => carregarParaEdicao(c)} className="p-1 text-orange-500 bg-orange-50 rounded-lg"><Edit2 size={11}/></button>
                              <button onClick={() => handleDeletarComunicado(c.id)} className="p-1 text-red-500 bg-red-50 rounded-lg"><Trash2 size={11}/></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : layoutAtual === 'foco' ? (
                /* FOCO — 5 mais recentes */
                <div className="max-w-2xl mx-auto space-y-3">
                  <div className="flex items-center gap-2 mb-4 px-1">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: rascunho.corPrimaria }} />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Modo Foco — {Math.min(comunicadosFiltrados.length, 5)} comunicados prioritários</span>
                  </div>
                  {[...comunicadosFiltrados].sort((a,b) => new Date(b.criado_em) - new Date(a.criado_em)).slice(0,5).map((c, i) => (
                    <div key={c.id} className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 transition-all hover:shadow-lg" style={{ borderColor: i === 0 ? rascunho.corPrimaria : '#e2e8f0', background: i === 0 ? rascunho.corPrimaria + '08' : '#fff' }}>
                      <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-white" style={{ background: i === 0 ? rascunho.corPrimaria : '#e2e8f0', color: i === 0 ? '#fff' : '#94a3b8' }}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-slate-800 truncate">{c.titulo}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{new Date(c.criado_em).toLocaleDateString('pt-BR')} · {c.tags}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button onClick={() => setPublicacaoVisualizada(c)} className="px-3 py-1.5 text-xs font-bold text-white rounded-xl" style={{ background: rascunho.corPrimaria }}>Ver</button>
                        <button onClick={() => carregarParaEdicao(c)} className="p-1.5 text-orange-500 bg-orange-50 rounded-xl"><Edit2 size={13}/></button>
                        <button onClick={() => handleDeletarComunicado(c.id)} className="p-1.5 text-red-500 bg-red-50 rounded-xl"><Trash2 size={13}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : layoutAtual === 'timeline' ? (
                /* TIMELINE — linha do tempo vertical */
                <div className="relative max-w-3xl mx-auto">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5" style={{ background: rascunho.corPrimaria + '30' }} />
                  <div className="space-y-6 pl-14">
                    {comunicadosFiltrados.map((c, i) => (
                      <div key={c.id} className="relative">
                        {/* Ponto na linha */}
                        <div className="absolute -left-9 top-4 w-4 h-4 rounded-full border-2 border-white shadow-md" style={{ background: i === 0 ? rascunho.corPrimaria : rascunho.corPrimaria + '60' }} />
                        <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{new Date(c.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              <h4 className="font-extrabold text-slate-800 mt-0.5">{c.titulo}</h4>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <button onClick={() => setPublicacaoVisualizada(c)} className="px-2.5 py-1.5 text-xs font-bold text-white rounded-lg" style={{ background: rascunho.corPrimaria }}>Ver</button>
                              <button onClick={() => carregarParaEdicao(c)} className="p-1.5 text-orange-500 bg-orange-50 rounded-lg"><Edit2 size={12}/></button>
                              <button onClick={() => handleDeletarComunicado(c.id)} className="p-1.5 text-red-500 bg-red-50 rounded-lg"><Trash2 size={12}/></button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: rascunho.corPrimaria, background: rascunho.corPrimaria + '15' }}>{c.tags}</span>
                            <span className="text-[10px] text-red-400 font-bold flex items-center gap-0.5"><Heart size={9} className="fill-current"/> {c.curtidas_comunicados?.length || 0}</span>
                            {c.anexos_comunicados?.length > 0 && <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5"><Paperclip size={9}/> {c.anexos_comunicados.length}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : layoutAtual === 'galeria' ? (
                /* GALERIA — grade visual ampla 2 colunas */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {comunicadosFiltrados.map((c, i) => (
                    <div key={c.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                      {/* Cabeçalho colorido */}
                      <div className="h-2" style={{ background: `linear-gradient(90deg, ${rascunho.corPrimaria}, ${rascunho.corSecundaria})` }} />
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0" style={{ background: rascunho.corPrimaria }}>{i + 1}</div>
                          <div className="flex gap-1">
                            <button onClick={() => carregarParaEdicao(c)} className="p-1.5 text-orange-500 bg-orange-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={12}/></button>
                            <button onClick={() => handleDeletarComunicado(c.id)} className="p-1.5 text-red-500 bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                          </div>
                        </div>
                        <h3 className="font-extrabold text-slate-800 mb-2 line-clamp-2">{c.titulo}</h3>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: rascunho.corPrimaria, background: rascunho.corPrimaria + '15' }}>{c.tags}</span>
                          <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5"><Calendar size={9}/> {new Date(c.criado_em).toLocaleDateString('pt-BR')}</span>
                          <span className="text-[10px] text-red-400 font-bold flex items-center gap-0.5"><Heart size={9} className="fill-current"/> {c.curtidas_comunicados?.length || 0}</span>
                        </div>
                        <button onClick={() => setPublicacaoVisualizada(c)} className="w-full py-2.5 text-sm font-bold text-white rounded-xl transition-all" style={{ background: `linear-gradient(135deg, ${rascunho.corPrimaria}, ${rascunho.corSecundaria})` }}>
                          Ver publicação
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : layoutAtual === 'tabela' ? (
                /* TABELA — linhas e colunas */
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ background: rascunho.corPrimaria + '10', borderBottom: `2px solid ${rascunho.corPrimaria}30` }}>
                          <th className="text-left px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider">#</th>
                          <th className="text-left px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider">Título</th>
                          <th className="text-left px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider hidden sm:table-cell">Tags</th>
                          <th className="text-left px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider hidden md:table-cell">Data</th>
                          <th className="text-left px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider hidden md:table-cell">❤️</th>
                          <th className="text-right px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {comunicadosFiltrados.map((c, i) => (
                          <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 text-xs font-black text-slate-400">{i + 1}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800 max-w-xs truncate">{c.titulo}</td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: rascunho.corPrimaria, background: rascunho.corPrimaria + '15' }}>{c.tags}</span>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell">{new Date(c.criado_em).toLocaleDateString('pt-BR')}</td>
                            <td className="px-4 py-3 text-xs text-red-400 font-bold hidden md:table-cell">{c.curtidas_comunicados?.length || 0}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1.5">
                                <button onClick={() => setPublicacaoVisualizada(c)} className="px-2.5 py-1 text-[10px] font-bold text-white rounded-lg" style={{ background: rascunho.corPrimaria }}>Ver</button>
                                <button onClick={() => carregarParaEdicao(c)} className="p-1.5 text-orange-500 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"><Edit2 size={11}/></button>
                                <button onClick={() => handleDeletarComunicado(c.id)} className="p-1.5 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"><Trash2 size={11}/></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* CARDS — padrão */
                <div className="grid gap-4">
                  {comunicadosFiltrados.map((comunicado) => (
                    <div key={comunicado.id} className="bg-white rounded-3xl border border-slate-100 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 overflow-hidden">
                      <div className="p-4 sm:p-6 md:p-8 tv:p-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                        <div className="flex-1">
                          <h3 className="font-extrabold text-xl text-slate-800 leading-tight mb-3">{comunicado.titulo}</h3>
                          <div className="flex flex-wrap items-center gap-3 mb-5">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1">
                              <Calendar size={12}/> {new Date(comunicado.criado_em).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ color: rascunho.corPrimaria, background: rascunho.corPrimaria + '10' }}>
                              <Tag size={12}/> {comunicado.tags}
                            </span>
                            {comunicado.modificado_por_usuario ? (
                              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg flex items-center gap-1">✏️ Modificado por: {comunicado.modificado_por_usuario.email?.split('@')[0]}</span>
                            ) : comunicado.autor ? (
                              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1">👤 Por: {comunicado.autor.email?.split('@')[0]}</span>
                            ) : null}
                            <span className="text-xs text-red-500 font-bold flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-lg">
                              <Heart size={12} className={comunicado.curtidas_comunicados?.length > 0 ? "fill-current" : ""}/> {comunicado.curtidas_comunicados?.length || 0} Curtida(s)
                            </span>
                            {comunicado.anexos_comunicados?.length > 0 && (
                              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg">
                                <Paperclip size={12}/> {comunicado.anexos_comunicados.length} Anexo(s)
                              </span>
                            )}
                          </div>
                          <button onClick={() => setPublicacaoVisualizada(comunicado)}
                            className="inline-flex items-center gap-2 text-sm font-bold text-white transition-all px-5 py-2.5 rounded-xl shadow-lg active:scale-95"
                            style={{ background: `linear-gradient(135deg, ${rascunho.corPrimaria}, ${rascunho.corSecundaria})` }}
                          >
                            <FileText size={16}/> Ver publicação e Interações
                          </button>
                        </div>
                        <div className="flex md:flex-col items-center justify-end gap-2 pt-4 md:pt-0 border-t md:border-0 border-slate-100 w-full md:w-auto">
                          <button onClick={() => carregarParaEdicao(comunicado)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-orange-600 bg-orange-50 hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600 hover:text-white rounded-xl transition-all border border-orange-200 hover:border-transparent shadow-sm hover:shadow-lg hover:shadow-orange-200 active:scale-95"
                          >
                            <Edit2 size={16} /> Editar
                          </button>
                          <button onClick={() => handleDeletarComunicado(comunicado.id)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-red-600 bg-red-50 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 hover:text-white rounded-xl transition-all border border-red-200 hover:border-transparent shadow-sm hover:shadow-lg hover:shadow-red-200 active:scale-95"
                          >
                            <Trash2 size={16} /> Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {abaAtiva === 'relatorios' && (
          <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            
            {/* HEADER COM BOTÃO DE DOWNLOAD */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 tv:p-10 rounded-3xl shadow-sm border border-slate-100">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
                  <div className="p-3 rounded-2xl text-white shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${rascunho.corPrimaria}, ${rascunho.corSecundaria})` }}
                  >
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 tv:grid-cols-3 gap-3 sm:gap-4 tv:gap-6">
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
            <div className="bg-white p-4 sm:p-6 md:p-8 tv:p-12 rounded-3xl shadow-xl border border-slate-100">
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
            <div className="bg-white p-4 sm:p-6 md:p-8 tv:p-12 rounded-3xl shadow-xl border border-slate-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-[#00A859] to-[#008C4A] p-3 rounded-2xl text-white shadow-lg shadow-[#00A859]/20">
                    <Users size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-800">Auditoria de Leitura Individual</h2>
                    <p className="text-sm text-slate-500">Rastreamento detalhado de cada acesso aos comunicados</p>
                  </div>
                </div>
                <div className="relative w-full sm:w-72 md:w-80 tv:w-[28rem] group">
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

      {/* Modal de preview — mostra exatamente como vai ficar publicado */}
      {previewAberto && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewAberto(false)}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
            style={{ color: '#1e293b' }}
          >
            {/* Header do preview */}
            <div className="px-6 py-4 border-b border-slate-100 bg-blue-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Eye size={20} className="text-blue-600" />
                <div>
                  <h3 className="font-extrabold text-blue-900 text-lg">Pré-visualização da Publicação</h3>
                  <p className="text-xs text-blue-600">Assim ficará para os atendentes após publicar</p>
                </div>
              </div>
              <button onClick={() => setPreviewAberto(false)} className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-all">
                <X size={20}/>
              </button>
            </div>

            {/* Conteúdo do preview — renderiza EXATAMENTE como vai ficar */}
            <div className="flex-1 overflow-y-auto">
              {/* Título */}
              <div className="px-6 py-4 border-b border-slate-100" style={{ background: '#f8fafc' }}>
                <h2 className="text-2xl font-extrabold" style={{ color: '#0f172a' }}>
                  {titulo || 'Sem título'}
                </h2>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                  <span>📅 {new Date().toLocaleDateString('pt-BR')}</span>
                  {tags && <span className="px-2 py-0.5 rounded-full" style={{ background: rascunho.corPrimaria + '15', color: rascunho.corPrimaria }}>{tags}</span>}
                </div>
              </div>

              {/* Conteúdo — sem nenhum CSS que altere o HTML original */}
              <div className="p-6 md:p-10"
                style={{ background: '#ffffff', color: '#334155', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif', fontSize: '14px', lineHeight: '1.7' }}
                dangerouslySetInnerHTML={{ __html: conteudo || '<p style="color:#94a3b8;font-style:italic;">Conteúdo vazio</p>' }}
              />
            </div>

            {/* Footer do preview */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <p className="text-xs text-slate-500">
                ✅ Se está como esperado, feche e clique em "{idEmEdicao ? 'Atualizar Comunicado' : 'Publicar Agora'}"
              </p>
              <button onClick={() => setPreviewAberto(false)}
                className="px-5 py-2.5 text-sm font-bold text-white rounded-xl active:scale-95"
                style={{ background: rascunho.corPrimaria }}
              >
                Fechar preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de inserção de vídeo no editor */}
      <ModalVideo
        onInserir={(html) => setConteudo(prev => prev + html)}
        aberto={modalVideoAberto}
        onFechar={() => setModalVideoAberto(false)}
        corPrimaria={rascunho.corPrimaria}
      />

      {/* ======================================================== */}
      {/* MODAL TELA CHEIA (COM OS NOMES DE QUEM CURTIU)           */}
      {/* ======================================================== */}
      {publicacaoVisualizada && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 lg:p-6 tv:p-12 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          
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
                  {publicacaoVisualizada.titulo}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: '#64748b' }}>
                    <Calendar size={14}/> Publicado em {new Date(publicacaoVisualizada.criado_em).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: rascunho.corPrimaria }}>
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
                className="p-2 rounded-full transition-all shrink-0"
                style={{ color: '#94a3b8', background: '#f1f5f9' }}
                title="Fechar Visualização"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 md:p-10 overflow-y-auto"
              style={{ background: '#ffffff', color: '#334155' }}
            >
               {/* Renderiza o HTML exatamente como foi salvo — mesmo método do preview */}
               <div 
                 className="conteudo-publicacao"
                 style={{ color: '#334155', background: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif', fontSize: '14px', lineHeight: '1.7' }}
                 dangerouslySetInnerHTML={{ __html: publicacaoVisualizada.conteudo || '' }} 
               />
            </div>

            {/* LISTA DE QUEM CURTIU */}
            {publicacaoVisualizada.curtidas_comunicados?.length > 0 && (
              <div className="px-6 py-4 md:px-8 border-t shrink-0"
                style={{ background: '#fff5f5', borderColor: '#fecaca' }}
              >
                <h4 className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                  <Heart size={14} className="fill-current"/> Curtido por ({publicacaoVisualizada.curtidas_comunicados.length} pessoas)
                </h4>
                <div className="flex flex-wrap gap-2 text-sm font-bold" style={{ color: '#475569' }}>
                  {publicacaoVisualizada.curtidas_comunicados.map((curtida, idx) => (
                    <span key={idx} className="bg-white border border-red-100 px-3 py-1.5 rounded-lg shadow-sm">
                      {curtida.usuarios?.nome_completo || 'Usuário Desconhecido'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {publicacaoVisualizada.anexos_comunicados?.length > 0 && (
              <div className="p-6 md:p-8 border-t shrink-0"
                style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}
              >
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2" style={{ color: '#64748b' }}>
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
            
            <div className="p-6 md:p-8 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-emerald-100 flex justify-between items-start gap-4 shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-2xl text-white shadow-lg shadow-emerald-200">
                  <HelpCircle size={32} />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800">Instruções de Uso — Monitoria</h2>
                  <p className="text-slate-600 font-medium mt-1">Guia completo de todas as funcionalidades</p>
                </div>
              </div>
              <button onClick={() => setModalInstrucoes(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-all shrink-0">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto">
              <div className="space-y-6">

                {/* 1. Editor de Conteúdo */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl border border-blue-200">
                  <h3 className="text-lg font-extrabold text-slate-800 mb-3 flex items-center gap-2">📝 1. Editor de Conteúdo (TinyMCE)</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li>• <strong>Formatação completa:</strong> Negrito, itálico, sublinhado, tachado, cores de texto e fundo</li>
                    <li>• <strong>Fontes e tamanhos:</strong> Seletor de família de fonte e tamanho na toolbar</li>
                    <li>• <strong>Alinhamento:</strong> Esquerda, centro, direita, justificado — funciona para texto E imagens</li>
                    <li>• <strong>Imagens:</strong> Inserir via toolbar → redimensionar arrastando as bordas → alinhar</li>
                    <li>• <strong>Vídeos:</strong> Insert → Media → colar URL do YouTube/Vimeo ou fazer upload local</li>
                    <li>• <strong>Tabelas:</strong> Inserir, mesclar células, adicionar/remover linhas e colunas</li>
                    <li>• <strong>Colar do Word:</strong> Copie do Word e cole — a formatação é preservada</li>
                    <li>• <strong>Emoticons:</strong> Inserir emojis diretamente no texto</li>
                    <li>• <strong>Tela cheia:</strong> Botão fullscreen para editar em tela inteira</li>
                    <li>• <strong>Código fonte:</strong> Botão "Code" para editar o HTML diretamente</li>
                  </ul>
                </div>

                {/* 2. Publicação */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 rounded-2xl border border-emerald-200">
                  <h3 className="text-lg font-extrabold text-slate-800 mb-3 flex items-center gap-2">📢 2. Publicar Comunicados</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li>• <strong>Título:</strong> Obrigatório — claro e objetivo</li>
                    <li>• <strong>Conteúdo:</strong> Use o editor rico para formatar o comunicado</li>
                    <li>• <strong>Tags:</strong> Palavras-chave separadas por vírgula (ex: processos, sac, crédito)</li>
                    <li>• <strong>Categoria/Pasta:</strong> Defina a pasta para organização (quando ativado em Personalizar)</li>
                    <li>• <strong>Dicas de destaque:</strong> Botão "💡 Inserir dica" adiciona alertas coloridos no conteúdo</li>
                    <li>• <strong>Visualizar antes:</strong> Botão "👁 Visualizar antes de publicar" mostra exatamente como ficará</li>
                    <li>• <strong>Anexos:</strong> Upload de arquivos até 50MB (PDFs, planilhas, imagens, vídeos)</li>
                    <li>• <strong>Mídias:</strong> Upload de vídeos, GIFs, imagens + links do YouTube com preview</li>
                    <li>• <strong>Publicar:</strong> Clique em "Publicar Agora" — todos os atendentes verão imediatamente</li>
                  </ul>
                </div>

                {/* 3. Editor Visual Polotno */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-2xl border border-purple-200">
                  <h3 className="text-lg font-extrabold text-slate-800 mb-3 flex items-center gap-2">🎨 3. Editor Visual (Polotno Studio)</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li>• <strong>Abrir:</strong> Botão "🎨 Abrir Editor Visual" abaixo do campo de conteúdo</li>
                    <li>• <strong>Criar design:</strong> Drag & drop de textos, imagens, formas, templates</li>
                    <li>• <strong>Baixar:</strong> Clique em "Baixar" no Polotno (botão azul no canto superior direito)</li>
                    <li>• <strong>Inserir no comunicado:</strong> Clique no botão verde "⬆️ Upload da imagem do design"</li>
                    <li>• <strong>A imagem vai direto para o conteúdo</strong> — pronta para publicar</li>
                  </ul>
                </div>

                {/* 4. Editar e Excluir */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-2xl border border-orange-200">
                  <h3 className="text-lg font-extrabold text-slate-800 mb-3 flex items-center gap-2">✏️ 4. Editar e Excluir</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li>• <strong>Editar:</strong> Botão "Editar" em qualquer comunicado → formulário fica em modo edição (laranja)</li>
                    <li>• <strong>Atualizar:</strong> Modifique o que precisar e clique em "Atualizar Comunicado"</li>
                    <li>• <strong>Cancelar:</strong> Botão "Cancelar" sai do modo edição sem salvar</li>
                    <li>• <strong>Excluir:</strong> Botão "Excluir" com confirmação — ação irreversível</li>
                    <li>• <strong>Rastreamento:</strong> O sistema registra quem modificou por último</li>
                  </ul>
                </div>

                {/* 5. Relatórios */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-5 rounded-2xl border border-indigo-200">
                  <h3 className="text-lg font-extrabold text-slate-800 mb-3 flex items-center gap-2">📊 5. Relatórios e Análises</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li>• <strong>Métricas:</strong> Total de comunicados, leituras e mais acessado</li>
                    <li>• <strong>Top 5:</strong> Ranking visual dos comunicados mais lidos com barras de progresso</li>
                    <li>• <strong>Auditoria:</strong> Tabela com quem leu, quando e qual comunicado</li>
                    <li>• <strong>Busca:</strong> Filtrar por atendente ou título</li>
                    <li>• <strong>Exportar CSV:</strong> Baixar relatório completo para Excel</li>
                  </ul>
                </div>

                {/* 6. Personalização */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-5 rounded-2xl border border-amber-200">
                  <h3 className="text-lg font-extrabold text-slate-800 mb-3 flex items-center gap-2">🎨 6. Personalização do Dashboard</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li>• <strong>Temas:</strong> 8 temas pré-definidos (Corporativo, Escuro, Moderno, Neon, etc.)</li>
                    <li>• <strong>Cores:</strong> Personalizar cor primária, secundária, fundo, texto e destaque</li>
                    <li>• <strong>Texto:</strong> Tamanho (Compacto/Padrão/Acessível) e família de fonte</li>
                    <li>• <strong>Layout:</strong> Cards, Lista, Kanban, Compacto, Magazine, Timeline, Galeria, Tabela</li>
                    <li>• <strong>Organização:</strong> Livre (cronológico) ou Pastas (agrupado por categoria)</li>
                    <li>• <strong>Pastas:</strong> Criar, renomear, excluir, reordenar pastas e mover comunicados entre elas</li>
                    <li>• <strong>Fundo:</strong> Upload de imagem de fundo com controle de opacidade</li>
                    <li>• <strong>Efeitos:</strong> Animações, modo minimalista, alto contraste</li>
                    <li>• <strong>Perfis:</strong> Salvar combinações (Trabalho, Noturno, Alta Concentração)</li>
                    <li>• <strong>Auto-save:</strong> Todas as preferências são salvas automaticamente por usuário</li>
                  </ul>
                </div>

                {/* 7. Vídeos */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-2xl border border-red-200">
                  <h3 className="text-lg font-extrabold text-slate-800 mb-3 flex items-center gap-2">🎬 7. Vídeos e Mídias</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li>• <strong>YouTube:</strong> Insert → Media → colar URL → vídeo aparece embutido</li>
                    <li>• <strong>Upload local:</strong> Insert → Media → Browse → selecionar arquivo de vídeo</li>
                    <li>• <strong>Formatos:</strong> MP4, WebM, OGG, AVI, MOV, MKV, WMV</li>
                    <li>• <strong>GIFs:</strong> Inserir como imagem — animação é preservada</li>
                    <li>• <strong>Botão vídeo:</strong> Ícone 🎬 na toolbar abre modal para URL ou upload</li>
                  </ul>
                </div>

                {/* 8. Dicas */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-5 rounded-2xl border border-yellow-200">
                  <h3 className="text-lg font-extrabold text-slate-800 mb-3 flex items-center gap-2">💡 8. Dicas Importantes</h3>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li>• Use "Visualizar antes de publicar" para conferir como ficará para os atendentes</li>
                    <li>• Imagens podem ser redimensionadas arrastando as bordas no editor</li>
                    <li>• O botão "💡 Inserir dica" adiciona alertas coloridos (Atenção, Importante, Info, Dica)</li>
                    <li>• Categorize os comunicados para facilitar a organização por pastas</li>
                    <li>• Vídeos do YouTube são a melhor opção (leves e com preview automático)</li>
                    <li>• Cada usuário tem sua própria personalização — não afeta os outros</li>
                    <li>• O sistema notifica automaticamente todos os atendentes ao publicar</li>
                  </ul>
                </div>

              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
              <button onClick={() => setModalInstrucoes(false)}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-200 active:scale-95"
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