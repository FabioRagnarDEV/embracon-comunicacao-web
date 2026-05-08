import DOMPurify from 'dompurify';

/**
 * Configuração do DOMPurify para sanitização de HTML no frontend
 * Previne XSS ao renderizar conteúdo com dangerouslySetInnerHTML
 */
const SANITIZE_CONFIG = {
    ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre', 'span', 'div',
        'iframe', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'sub', 'sup', 'hr'
    ],
    ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'style', 'target',
        'width', 'height', 'allowfullscreen', 'frameborder',
        'rel', 'colspan', 'rowspan'
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

/**
 * Sanitiza HTML para renderização segura no frontend
 * Deve ser usado SEMPRE antes de dangerouslySetInnerHTML
 */
export function sanitizarHTML(html) {
    if (!html) return '';
    return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}

/**
 * Decodifica entidades HTML e sanitiza o resultado
 * Substitui a função decodificarHTML insegura usada nos dashboards
 */
export function decodificarHTMLSeguro(html) {
    if (!html) return '<p class="text-slate-400 italic">Este comunicado não possui texto.</p>';
    
    // Decodificar entidades HTML
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    const decoded = txt.value;
    
    // Sanitizar o resultado antes de retornar
    return sanitizarHTML(decoded);
}

export default { sanitizarHTML, decodificarHTMLSeguro };
