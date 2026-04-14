/**
 * Serviço centralizado para comunicação com a API
 * Gerencia autenticação, headers e tratamento de erros
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Função auxiliar para fazer requisições autenticadas
 */
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        }
    };

    // Adicionar token se existir (exceto para login)
    if (token && !endpoint.includes('/auth/login')) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Remover Content-Type se for FormData (upload de arquivos)
    if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    try {
        console.log('🔵 Fazendo requisição para:', `${API_URL}${endpoint}`);
        console.log('🔵 Config:', config);
        
        const response = await fetch(`${API_URL}${endpoint}`, config);
        
        console.log('🔵 Resposta status:', response.status);

        // Tratar erros de autenticação
        if (response.status === 401) {
            // Token inválido ou expirado - limpar e redirecionar
            localStorage.clear();
            window.location.href = '/';
            throw new Error('Sessão expirada. Faça login novamente.');
        }

        // Tratar erro de permissão
        if (response.status === 403) {
            throw new Error('Você não tem permissão para esta ação.');
        }

        // Tratar rate limiting
        if (response.status === 429) {
            throw new Error('Muitas requisições. Aguarde alguns minutos e tente novamente.');
        }

        // Tratar outros erros
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('🔴 Erro da API:', errorData);
            throw new Error(errorData.erro || 'Erro ao processar requisição.');
        }

        return response;
    } catch (error) {
        console.error('🔴 Erro na requisição:', error);
        throw error;
    }
}

/**
 * Serviço de Autenticação
 */
export const authService = {
    /**
     * Fazer login
     */
    async login(email, password) {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        // Salvar token e dados do usuário
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario_id', data.usuario.id);
        localStorage.setItem('usuario_nome', data.usuario.nome);
        localStorage.setItem('usuario_perfil', data.usuario.perfil);
        
        return data;
    },

    /**
     * Fazer logout
     */
    logout() {
        localStorage.clear();
        window.location.href = '/';
    },

    /**
     * Verificar se está autenticado
     */
    isAuthenticated() {
        return !!localStorage.getItem('token');
    },

    /**
     * Obter dados do usuário logado
     */
    getUser() {
        return {
            id: localStorage.getItem('usuario_id'),
            nome: localStorage.getItem('usuario_nome'),
            perfil: localStorage.getItem('usuario_perfil')
        };
    }
};

/**
 * Serviço de Comunicados
 */
export const comunicadosService = {
    /**
     * Listar todos os comunicados
     */
    async listar() {
        const response = await apiRequest('/comunicados');
        return response.json();
    },

    /**
     * Criar novo comunicado (apenas MONITOR_QUALIDADE)
     */
    async criar(formData) {
        const response = await apiRequest('/comunicados', {
            method: 'POST',
            body: formData // FormData com arquivos
        });
        return response.json();
    },

    /**
     * Atualizar comunicado
     */
    async atualizar(id, formData) {
        const response = await apiRequest(`/comunicados/${id}`, {
            method: 'PUT',
            body: formData
        });
        return response.json();
    },

    /**
     * Deletar comunicado
     */
    async deletar(id) {
        const response = await apiRequest(`/comunicados/${id}`, {
            method: 'DELETE'
        });
        return response.json();
    },

    /**
     * Curtir/descurtir comunicado
     */
    async curtir(id) {
        const response = await apiRequest(`/comunicados/${id}/curtir`, {
            method: 'POST'
        });
        return response.json();
    },

    /**
     * Registrar leitura de comunicado
     */
    async registrarLeitura(comunicadoId) {
        const response = await apiRequest('/comunicados/ler', {
            method: 'POST',
            body: JSON.stringify({ comunicado_id: comunicadoId })
        });
        return response.json();
    }
};

/**
 * Serviço de Scripts
 */
export const scriptsService = {
    /**
     * Listar scripts do usuário e da equipe
     */
    async listar() {
        const response = await apiRequest('/scripts');
        return response.json();
    },

    /**
     * Criar novo script
     */
    async criar(formData) {
        const response = await apiRequest('/scripts', {
            method: 'POST',
            body: formData
        });
        return response.json();
    },

    /**
     * Atualizar script
     */
    async atualizar(id, formData) {
        const response = await apiRequest(`/scripts/${id}`, {
            method: 'PUT',
            body: formData
        });
        return response.json();
    },

    /**
     * Deletar script
     */
    async deletar(id) {
        const response = await apiRequest(`/scripts/${id}`, {
            method: 'DELETE'
        });
        return response.json();
    }
};

/**
 * Serviço de Notificações
 */
export const notificacoesService = {
    /**
     * Listar notificações do usuário
     */
    async listar() {
        const response = await apiRequest('/notificacoes');
        return response.json();
    },

    /**
     * Marcar notificação como lida
     */
    async marcarComoLida(id) {
        const response = await apiRequest(`/notificacoes/${id}/ler`, {
            method: 'PUT'
        });
        return response.json();
    }
};

/**
 * Serviço de Relatórios (apenas MONITOR_QUALIDADE)
 */
export const relatoriosService = {
    /**
     * Obter métricas e relatórios
     */
    async obterMetricas() {
        const response = await apiRequest('/relatorios');
        return response.json();
    }
};

export default {
    auth: authService,
    comunicados: comunicadosService,
    scripts: scriptsService,
    notificacoes: notificacoesService,
    relatorios: relatoriosService
};
