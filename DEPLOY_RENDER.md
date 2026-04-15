# 🚀 GUIA DE DEPLOY NO RENDER - FRONTEND

## Passo 1: Criar Static Site

1. Acesse: https://dashboard.render.com/
2. Clique em **"New +"** → **"Static Site"**
3. Conecte seu repositório: `https://github.com/FabioRagnarDEV/embracon-comunicacao-web.git`

## Passo 2: Configurações Básicas

```
Name: embracon-web
Branch: main
Build Command: npm install && npm run build
Publish Directory: dist
```

## Passo 3: Variáveis de Ambiente

Clique em **"Advanced"** e adicione:

```
VITE_API_URL = https://embracon-api.onrender.com/api
```

⚠️ **IMPORTANTE:** Use a URL real da sua API (do passo anterior)!

## Passo 4: Deploy

1. Clique em **"Create Static Site"**
2. Aguarde o build (2-3 minutos)
3. Anote a URL: `https://embracon-web.onrender.com`

## Passo 5: Atualizar CORS na API

Volte na configuração da API e atualize:

```
ALLOWED_ORIGINS = https://embracon-web.onrender.com
```

Depois clique em **"Manual Deploy"** → **"Clear build cache & deploy"**

## ✅ Testar

1. Acesse: `https://embracon-web.onrender.com`
2. Faça login
3. Teste todas as funcionalidades

---

## 🔧 TROUBLESHOOTING

### Erro: "Failed to fetch"
- Verifique se VITE_API_URL está correto
- Verifique se a API está rodando
- Verifique CORS na API

### Página em branco
- Verifique se o build command está correto
- Verifique se publish directory é `dist`
- Veja os logs do build

### Erro 404 ao recarregar página
Adicione arquivo `_redirects` na pasta `public/`:
```
/*    /index.html   200
```
