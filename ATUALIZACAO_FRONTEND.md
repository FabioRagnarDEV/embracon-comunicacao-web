# 🔄 GUIA DE ATUALIZAÇÃO DO FRONTEND

## O que foi criado

### 1. Serviço de API Centralizado
**Arquivo:** `src/services/api.js`

Este arquivo centraliza toda a comunicação com o backend:
- ✅ Adiciona automaticamente o token JWT em todas as requisições
- ✅ Trata erros de autenticação (401, 403)
- ✅ Trata rate limiting (429)
- ✅ Redireciona para login quando sessão expira
- ✅ Suporta upload de arquivos (FormData)

### 2. Serviços Organizados por Funcionalidade

```javascript
import api from './services/api';

// Autenticação
await api.auth.login(email, password);
api.auth.logout();

// Comunicados
await api.comunicados.listar();
await api.comunicados.criar(formData);
await api.comunicados.curtir(id);

// Scripts
await api.scripts.listar();
await api.scripts.criar(formData);

// Notificações
await api.notificacoes.listar();
await api.notificacoes.marcarComoLida(id);

// Relatórios
await api.relatorios.obterMetricas();
```

---

## 📝 COMO ATUALIZAR CADA COMPONENTE

### Passo 1: Importar o serviço

No topo de cada arquivo que faz requisições:

```javascript
// ANTES
// Sem imports

// DEPOIS
import { comunicadosService, scriptsService, notificacoesService } from '../services/api';
```

### Passo 2: Substituir fetch por serviço

#### Exemplo: DashboardAtendente.jsx

**ANTES:**
```javascript
const buscarComunicados = useCallback(async () => {
  try {
    const response = await fetch(`http://localhost:3000/comunicados?_t=${Date.now()}`);
    if (response.ok) setListaComunicados(await response.json());
  } catch (error) { 
    console.error('Erro na busca de comunicados'); 
  }
}, []);
```

**DEPOIS:**
```javascript
const buscarComunicados = useCallback(async () => {
  try {
    const data = await comunicadosService.listar();
    setListaComunicados(data);
  } catch (error) { 
    console.error('Erro na busca de comunicados:', error.message);
    mostrarMensagem(error.message, 'erro');
  }
}, []);
```

#### Exemplo: Curtir Comunicado

**ANTES:**
```javascript
const toggleCurtida = async (comunicadoId, e) => {
  e.stopPropagation();
  // ... código de atualização otimista ...
  
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
```

**DEPOIS:**
```javascript
const toggleCurtida = async (comunicadoId, e) => {
  e.stopPropagation();
  // ... código de atualização otimista ...
  
  try {
    await comunicadosService.curtir(comunicadoId);
  } catch (error) {
    mostrarMensagem(error.message, 'erro');
    buscarComunicados();
  }
};
```

#### Exemplo: Criar Script com Upload

**ANTES:**
```javascript
const salvarScript = async (e) => {
  e.preventDefault();
  // ...
  
  const formData = new FormData();
  formData.append('titulo', tituloScript);
  formData.append('conteudo', conteudoScript);
  formData.append('autor_id', usuarioId);
  formData.append('visivel_equipe', compartilharScript);
  
  if (arquivosScript) {
    Array.from(arquivosScript).forEach(arq => formData.append('arquivos', arq));
  }
  
  const response = await fetch(url, { method: metodo, body: formData });
  // ...
};
```

**DEPOIS:**
```javascript
const salvarScript = async (e) => {
  e.preventDefault();
  // ...
  
  const formData = new FormData();
  formData.append('titulo', tituloScript);
  formData.append('conteudo', conteudoScript);
  formData.append('visivel_equipe', compartilharScript);
  
  if (arquivosScript) {
    Array.from(arquivosScript).forEach(arq => formData.append('arquivos', arq));
  }
  
  try {
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
```

---

## 🔧 MUDANÇAS ESPECÍFICAS POR ARQUIVO

### Login.jsx
✅ **JÁ ATUALIZADO!**

### DashboardAtendente.jsx

Substituir todas as chamadas:

```javascript
// Importar no topo
import { comunicadosService, scriptsService, notificacoesService } from '../services/api';

// Buscar comunicados
const data = await comunicadosService.listar();

// Buscar scripts (não precisa mais passar usuario_id)
const data = await scriptsService.listar();

// Buscar notificações (não precisa mais passar usuario_id)
const data = await notificacoesService.listar();

// Curtir
await comunicadosService.curtir(comunicadoId);

// Registrar leitura
await comunicadosService.registrarLeitura(comunicado.id);

// Marcar notificação como lida
await notificacoesService.marcarComoLida(notificacao.id);

// Criar script
await scriptsService.criar(formData);

// Atualizar script
await scriptsService.atualizar(id, formData);

// Deletar script
await scriptsService.deletar(id);
```

### DashboardMonitoria.jsx

```javascript
// Importar no topo
import { comunicadosService, relatoriosService } from '../services/api';

// Buscar comunicados
const data = await comunicadosService.listar();

// Criar comunicado
await comunicadosService.criar(formData);

// Atualizar comunicado
await comunicadosService.atualizar(id, formData);

// Deletar comunicado
await comunicadosService.deletar(id);

// Buscar relatórios
const data = await relatoriosService.obterMetricas();
```

---

## ⚙️ CONFIGURAÇÃO

### 1. Criar arquivo .env

```bash
cd embracon-comunicacao-web
cp .env.example .env
```

Editar `.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

### 2. Adicionar .env ao .gitignore

Verificar se `.env` está no `.gitignore`:
```
.env
.env.local
.env.*.local
```

---

## ✅ CHECKLIST DE ATUALIZAÇÃO

### Arquivos Criados
- [x] `src/services/api.js`
- [x] `.env.example`
- [x] `ATUALIZACAO_FRONTEND.md`

### Arquivos a Atualizar
- [x] `src/pages/Login.jsx` (já atualizado)
- [ ] `src/pages/DashboardAtendente.jsx`
- [ ] `src/pages/DashboardMonitoria.jsx`

### Mudanças Necessárias

#### DashboardAtendente.jsx
- [ ] Importar serviços
- [ ] Substituir `buscarComunicados()`
- [ ] Substituir `buscarScripts()` (remover usuario_id da URL)
- [ ] Substituir `buscarNotificacoes()` (remover usuario_id da URL)
- [ ] Substituir `toggleCurtida()`
- [ ] Substituir `registrarLeitura()`
- [ ] Substituir `lerNotificacao()`
- [ ] Substituir `salvarScript()`
- [ ] Substituir `deletarScript()`

#### DashboardMonitoria.jsx
- [ ] Importar serviços
- [ ] Substituir `buscarComunicados()`
- [ ] Substituir `buscarRelatorios()`
- [ ] Substituir `handleSalvarComunicado()`
- [ ] Substituir `handleDeletarComunicado()`

---

## 🧪 TESTAR APÓS ATUALIZAÇÃO

### 1. Login
- [ ] Login com credenciais válidas
- [ ] Login com credenciais inválidas
- [ ] Redirecionamento correto por perfil

### 2. Comunicados
- [ ] Listar comunicados
- [ ] Criar comunicado (monitor)
- [ ] Editar comunicado
- [ ] Deletar comunicado
- [ ] Curtir comunicado
- [ ] Visualizar comunicado

### 3. Scripts
- [ ] Listar scripts
- [ ] Criar script
- [ ] Editar script
- [ ] Deletar script
- [ ] Compartilhar com equipe

### 4. Notificações
- [ ] Listar notificações
- [ ] Marcar como lida
- [ ] Clicar em notificação abre comunicado

### 5. Relatórios (Monitor)
- [ ] Ver ranking
- [ ] Ver histórico

### 6. Erros
- [ ] Token expirado redireciona para login
- [ ] Sem permissão mostra mensagem
- [ ] Rate limit mostra mensagem

---

## 🚨 PROBLEMAS COMUNS

### "Sessão expirada" ao carregar página
**Causa:** Token inválido ou expirado  
**Solução:** Fazer login novamente

### "Origem não permitida pelo CORS"
**Causa:** Frontend não está em ALLOWED_ORIGINS  
**Solução:** Adicionar `http://localhost:5173` no `.env` da API

### "Erro ao buscar dados"
**Causa:** API não está rodando  
**Solução:** Iniciar API com `node index.refatorado.js`

### Requisições sem token
**Causa:** Serviço não está sendo usado  
**Solução:** Importar e usar serviços de `api.js`

---

## 📞 SUPORTE

Se tiver dúvidas:
1. Consulte este guia
2. Verifique console do navegador (F12)
3. Verifique logs da API em `logs/error.log`

---

**Boa atualização! 🚀**
