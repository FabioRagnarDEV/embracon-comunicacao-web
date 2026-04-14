# 🚀 INÍCIO RÁPIDO - Atualização do Frontend

## ✅ O que já foi feito

1. ✅ **Serviço de API criado** (`src/services/api.js`)
2. ✅ **Login.jsx atualizado** (já funciona com a nova API)
3. ✅ **Documentação completa** (`ATUALIZACAO_FRONTEND.md`)

---

## 🎯 O que você precisa fazer

### Passo 1: Configurar ambiente (2 minutos)

```bash
# 1. Entrar na pasta do frontend
cd embracon-comunicacao-web

# 2. Criar arquivo .env
cp .env.example .env

# 3. Verificar se está correto
cat .env
# Deve mostrar: VITE_API_URL=http://localhost:3000/api
```

### Passo 2: Testar o Login (5 minutos)

```bash
# 1. Certifique-se que a API está rodando
# Em outro terminal:
cd embracon-comunicacao-api
node index.refatorado.js

# 2. Iniciar o frontend
cd embracon-comunicacao-web
npm run dev

# 3. Abrir no navegador
# http://localhost:5173

# 4. Fazer login
# O login já está funcionando com a nova API!
```

### Passo 3: Atualizar DashboardAtendente.jsx (15 minutos)

Abra `src/pages/DashboardAtendente.jsx` e faça as seguintes mudanças:

#### 3.1. Adicionar import no topo

```javascript
// Adicionar esta linha no topo do arquivo (após os outros imports)
import { comunicadosService, scriptsService, notificacoesService } from '../services/api';
```

#### 3.2. Substituir função `buscarComunicados`

**Encontre:**
```javascript
const buscarComunicados = useCallback(async () => {
  try {
    const response = await fetch(`http://localhost:3000/comunicados?_t=${Date.now()}`);
    if (response.ok) setListaComunicados(await response.json());
  } catch (error) { console.error('Erro na busca de comunicados'); }
}, []);
```

**Substitua por:**
```javascript
const buscarComunicados = useCallback(async () => {
  try {
    const data = await comunicadosService.listar();
    setListaComunicados(data);
  } catch (error) { 
    console.error('Erro na busca de comunicados:', error.message);
  }
}, []);
```

#### 3.3. Substituir função `buscarScripts`

**Encontre:**
```javascript
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
```

**Substitua por:**
```javascript
const buscarScripts = useCallback(async () => {
  try {
    const data = await scriptsService.listar();
    setListaScripts(data || []);
  } catch (error) { 
    console.error('Erro ao buscar scripts:', error.message);
  }
}, []);
```

#### 3.4. Substituir função `buscarNotificacoes`

**Encontre:**
```javascript
const buscarNotificacoes = useCallback(async () => {
  if (!usuarioId) return;
  try {
    const response = await fetch(`http://localhost:3000/notificacoes/${usuarioId}?_t=${Date.now()}`);
    if (response.ok) setNotificacoes(await response.json());
  } catch (error) { console.error('Erro ao buscar notificações'); }
}, [usuarioId]);
```

**Substitua por:**
```javascript
const buscarNotificacoes = useCallback(async () => {
  try {
    const data = await notificacoesService.listar();
    setNotificacoes(data);
  } catch (error) { 
    console.error('Erro ao buscar notificações:', error.message);
  }
}, []);
```

#### 3.5. Substituir função `registrarLeitura`

**Encontre:**
```javascript
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
```

**Substitua por:**
```javascript
const registrarLeitura = async (comunicado) => {
  setPublicacaoVisualizada(comunicado); 
  try {
    await comunicadosService.registrarLeitura(comunicado.id);
  } catch (error) { 
    console.log("Rastreio falhou:", error.message); 
  }
};
```

#### 3.6. Substituir função `toggleCurtida`

**Encontre a parte do fetch dentro de `toggleCurtida`:**
```javascript
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
```

**Substitua por:**
```javascript
try {
  await comunicadosService.curtir(comunicadoId);
} catch (error) {
  mostrarMensagem(error.message, 'erro');
  buscarComunicados(); 
}
```

#### 3.7. Substituir função `lerNotificacao`

**Encontre a parte do fetch:**
```javascript
if (!notificacao.lida) {
  setNotificacoes(prev => prev.map(n => n.id === notificacao.id ? { ...n, lida: true } : n));
  fetch(`http://localhost:3000/notificacoes/${notificacao.id}/ler`, { method: 'PUT' }).catch(console.error);
}
```

**Substitua por:**
```javascript
if (!notificacao.lida) {
  setNotificacoes(prev => prev.map(n => n.id === notificacao.id ? { ...n, lida: true } : n));
  notificacoesService.marcarComoLida(notificacao.id).catch(console.error);
}
```

#### 3.8. Substituir função `salvarScript`

**Encontre:**
```javascript
const salvarScript = async (e) => { 
  e.preventDefault(); 
  if (!tituloScript || !conteudoScript) return mostrarMensagem('Preencha título e conteúdo', 'erro'); 
  try { 
    const url = idEmEdicaoScript ? `http://localhost:3000/scripts/${idEmEdicaoScript}` : 'http://localhost:3000/scripts'; 
    const metodo = idEmEdicaoScript ? 'PUT' : 'POST'; 
    const formData = new FormData(); 
    formData.append('titulo', tituloScript); 
    formData.append('conteudo', conteudoScript); 
    formData.append('autor_id', usuarioId); 
    formData.append('visivel_equipe', compartilharScript); 
    if (arquivosScript) { 
      Array.from(arquivosScript).forEach(arq => formData.append('arquivos', arq)); 
    } 
    const response = await fetch(url, { method: metodo, body: formData }); 
    if (response.ok) { 
      mostrarMensagem(idEmEdicaoScript ? 'Script atualizado!' : 'Script salvo!'); 
      cancelarEdicaoScript(); 
      buscarScripts(); 
    } else { 
      mostrarMensagem('Falha ao salvar', 'erro'); 
    } 
  } catch (error) { 
    mostrarMensagem('Erro de Rede.', 'erro'); 
  } 
};
```

**Substitua por:**
```javascript
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
```

#### 3.9. Substituir função `deletarScript`

**Encontre:**
```javascript
const deletarScript = async (id, e) => { 
  e.stopPropagation(); 
  if (!window.confirm("Apagar este script?")) return; 
  try { 
    const response = await fetch(`http://localhost:3000/scripts/${id}`, { method: 'DELETE' }); 
    if (response.ok) { 
      mostrarMensagem('Script apagado.'); 
      buscarScripts(); 
    } 
  } catch (error) { 
    mostrarMensagem('Erro ao apagar.', 'erro'); 
  } 
};
```

**Substitua por:**
```javascript
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
```

### Passo 4: Atualizar DashboardMonitoria.jsx (10 minutos)

Abra `src/pages/DashboardMonitoria.jsx`:

#### 4.1. Adicionar import

```javascript
import { comunicadosService, relatoriosService } from '../services/api';
```

#### 4.2. Substituir `buscarComunicados`

```javascript
const buscarComunicados = useCallback(async () => {
  try {
    const data = await comunicadosService.listar();
    setListaComunicados(data);
  } catch (error) {
    mostrarMensagem('Erro ao carregar dados do servidor.', 'erro');
  }
}, []);
```

#### 4.3. Substituir `buscarRelatorios`

```javascript
const buscarRelatorios = useCallback(async () => {
  try {
    const data = await relatoriosService.obterMetricas();
    setMetricas(data);
  } catch (error) {
    console.error('Erro ao carregar relatórios.');
  }
}, []);
```

#### 4.4. Substituir `handleSalvarComunicado`

**Encontre a parte do fetch:**
```javascript
const response = await fetch(url, { method: metodo, body: formData });

if (response.ok) {
  mostrarMensagem(idEmEdicao ? 'Comunicado atualizado com sucesso!' : 'Comunicado publicado com sucesso!');
  cancelarEdicao();
  buscarComunicados();
} else {
  mostrarMensagem('Erro ao salvar no banco de dados.', 'erro');
}
```

**Substitua por:**
```javascript
if (idEmEdicao) {
  await comunicadosService.atualizar(idEmEdicao, formData);
  mostrarMensagem('Comunicado atualizado com sucesso!');
} else {
  await comunicadosService.criar(formData);
  mostrarMensagem('Comunicado publicado com sucesso!');
}

cancelarEdicao();
buscarComunicados();
```

#### 4.5. Substituir `handleDeletarComunicado`

```javascript
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
```

---

## ✅ Pronto!

Agora teste tudo:

```bash
# 1. API rodando
cd embracon-comunicacao-api
node index.refatorado.js

# 2. Frontend rodando
cd embracon-comunicacao-web
npm run dev

# 3. Abrir navegador
http://localhost:5173

# 4. Fazer login e testar todas as funcionalidades
```

---

## 🎉 Resultado

✅ Login funcionando  
✅ Token JWT automático em todas as requisições  
✅ Tratamento de erros (401, 403, 429)  
✅ Código mais limpo e organizado  
✅ Fácil manutenção  

---

## 📞 Problemas?

Consulte `ATUALIZACAO_FRONTEND.md` para detalhes completos!
