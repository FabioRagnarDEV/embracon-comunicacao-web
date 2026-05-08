import { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';

/**
 * EditorConteudo — editor rico completo estilo Word usando TinyMCE.
 * Suporta: alinhamento de imagens, resize com drag, tabelas, vídeos, colar do Word, etc.
 *
 * Props:
 *  value     — HTML do conteúdo
 *  onChange  — callback(novoHtml)
 *  height    — altura do editor (default: 400)
 *  onVideoClick — callback para abrir modal de vídeo customizado
 */
export default function EditorConteudo({ value, onChange, height = 400, onVideoClick }) {
  const editorRef = useRef(null);

  return (
    <Editor
      onInit={(evt, editor) => { editorRef.current = editor; }}
      value={value}
      onEditorChange={(content) => onChange(content)}
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      init={{
        license_key: 'gpl',
        height,
        menubar: true,
        language: 'pt_BR',
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'media', 'table', 'help', 'wordcount',
          'emoticons', 'codesample', 'quickbars',
        ],
        toolbar: [
          'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough',
          'forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent',
          'image media link table emoticons | removeformat fullscreen code help',
        ].join(' | '),
        // Upload de imagens — converte para base64 inline
        images_upload_handler: (blobInfo) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blobInfo.blob());
          });
        },
        // Permitir TODOS os formatos de imagem
        images_file_types: 'jpeg,jpg,jpe,jfi,jif,jfif,png,gif,bmp,webp,svg,ico,tif,tiff,avif',
        // Configuração de imagem com resize e alinhamento
        image_advtab: true,
        image_caption: true,
        image_title: true,
        automatic_uploads: true,
        // File picker para imagens E vídeos
        file_picker_types: 'image media',
        file_picker_callback: (callback, value, meta) => {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          
          if (meta.filetype === 'image') {
            input.setAttribute('accept', 'image/*');
            input.onchange = function() {
              const file = this.files[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = function() {
                callback(reader.result, { title: file.name, alt: file.name });
              };
              reader.readAsDataURL(file);
            };
          } else if (meta.filetype === 'media') {
            // Para vídeos: usar URL temporária para preview
            input.setAttribute('accept', 'video/*');
            input.onchange = function() {
              const file = this.files[0];
              if (!file) return;
              const blobUrl = URL.createObjectURL(file);
              callback(blobUrl, { title: file.name });
            };
          }
          
          input.click();
        },
        // Permitir resize de imagens com drag
        object_resizing: true,
        resize_img_proportional: true,
        // Permitir colar do Word
        paste_data_images: true,
        paste_as_text: false,
        // Tabelas
        table_advtab: true,
        table_cell_advtab: true,
        table_row_advtab: true,
        // Quick toolbar para imagens
        quickbars_insert_toolbar: 'image media table',
        quickbars_selection_toolbar: 'bold italic | blocks | alignleft aligncenter alignright',
        quickbars_image_toolbar: 'alignleft aligncenter alignright | imageoptions',
        // Formatos de vídeo aceitos
        media_alt_source: true,
        media_poster: true,
        media_dimensions: true,
        media_live_embeds: true,
        // Resolver URLs de vídeo (YouTube, Vimeo)
        media_url_resolver: (data, resolve) => {
          const url = data.url || '';
          // YouTube
          const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&?\s]+)/);
          if (ytMatch) {
            resolve({
              html: `<iframe src="https://www.youtube.com/embed/${ytMatch[1]}" width="560" height="315" style="max-width:100%;border-radius:12px;margin:12px 0;" frameborder="0" allowfullscreen loading="lazy"></iframe>`
            });
            return;
          }
          // Vimeo
          const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
          if (vimeoMatch) {
            resolve({
              html: `<iframe src="https://player.vimeo.com/video/${vimeoMatch[1]}" width="560" height="315" style="max-width:100%;border-radius:12px;margin:12px 0;" frameborder="0" allowfullscreen loading="lazy"></iframe>`
            });
            return;
          }
          // Outros vídeos diretos
          resolve({ html: '' });
        },
        // Estilo do conteúdo
        content_style: `
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            font-size: 14px; 
            line-height: 1.7; 
            color: #1e293b;
            padding: 16px;
          }
          img { 
            max-width: 100%; 
            height: auto; 
            border-radius: 8px;
            cursor: nwse-resize;
          }
          video {
            max-width: 100%;
            border-radius: 8px;
          }
          table { 
            border-collapse: collapse; 
            width: 100%; 
          }
          table td, table th { 
            border: 1px solid #e2e8f0; 
            padding: 8px 12px; 
          }
          table th { 
            background: #f8fafc; 
            font-weight: 700; 
          }
          blockquote {
            border-left: 4px solid #3b82f6;
            padding-left: 16px;
            margin-left: 0;
            color: #64748b;
            font-style: italic;
          }
          a { color: #2563eb; }
        `,
        // Skin e tema
        skin: 'oxide',
        content_css: 'default',
        // Callbacks
        setup: (editor) => {
          if (onVideoClick) {
            editor.ui.registry.addButton('customvideo', {
              icon: 'embed',
              tooltip: 'Inserir vídeo YouTube',
              onAction: () => onVideoClick(),
            });
          }
        },
        // Permitir todos os elementos HTML
        valid_elements: '*[*]',
        extended_valid_elements: 'iframe[src|width|height|style|allowfullscreen|frameborder|loading],video[src|controls|style|width|height|autoplay|muted|loop],source[src|type],div[style|class]',
      }}
    />
  );
}
