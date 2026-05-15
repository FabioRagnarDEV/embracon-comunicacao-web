/**
 * Serviço centralizado para comunicação com a API.
 * Gerencia autenticação, headers e tratamento de erros.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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

    if (options.body instanceof FormData) {
        delete config.headers['Content-Type'];
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario_id');
            localStorage.removeItem('usuario_nome');
            localStorage.removeItem('usuario_perfil');
            window.location.href = '/';
            throw new Error('Sessão expirada. Faça login novamente.');
        }

        if (response.status === 403) {
            throw new Error('Você não tem permissão para esta ação.');
        }

        if (response.status === 429) {
            throw new Error('Muitas requisições. Aguarde alguns minutos e tente novamente.');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.erro || 'Erro ao processar requisição.');
        }

        return response;
    } catch (error) {
        throw error;
    }
}

/**
 * Serviço de Autenticação
 */
export const authService = {
    async login(email, password) {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario_id', data.usuario.id);
        localStorage.setItem('usuario_nome', data.usuario.nome);
        localStorage.setItem('usuario_perfil', data.usuario.perfil);
        
        return data;
    },

    /**
     * Fazer logout — notifica o backend e limpa dados locais
     */
    async logout() {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch {
            // Limpar dados locais mesmo se o backend falhar
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario_id');
            localStorage.removeItem('usuario_nome');
            localStorage.removeItem('usuario_perfil');
            window.location.href = '/';
        }
    },

    /**
     * Verificar se está autenticado
     */
    isAuthenticated() {
        return !!localStorage.getItem('token');
    },

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
    async listar() {
        const response = await apiRequest('/comunicados');
        const resultado = await response.json();
        return resultado.data || resultado;
    },

    async criar(formData) {
        const response = await apiRequest('/comunicados', {
            method: 'POST',
            body: formData // FormData com arquivos
        });
        return response.json();
    },

    async atualizar(id, formData) {
        const response = await apiRequest(`/comunicados/${id}`, {
            method: 'PUT',
            body: formData
        });
        return response.json();
    },

    async deletar(id) {
        const response = await apiRequest(`/comunicados/${id}`, {
            method: 'DELETE'
        });
        return response.json();
    },

    async curtir(id) {
        const response = await apiRequest(`/comunicados/${id}/curtir`, {
            method: 'POST'
        });
        return response.json();
    },

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
    async listar() {
        const response = await apiRequest('/scripts');
        return response.json();
    },

    async criar(formData) {
        const response = await apiRequest('/scripts', {
            method: 'POST',
            body: formData
        });
        return response.json();
    },

    async atualizar(id, formData) {
        const response = await apiRequest(`/scripts/${id}`, {
            method: 'PUT',
            body: formData
        });
        return response.json();
    },

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
    async listar() {
        const response = await apiRequest('/notificacoes');
        return response.json();
    },

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
