import { useState, useCallback, useEffect } from 'react';

/**
 * Hook para gerenciar organização por pastas do atendente.
 * Persiste no localStorage por usuário.
 *
 * Estrutura salva:
 * {
 *   pastas: [{ id, nome, ordem }],
 *   atribuicoes: { [comunicadoId]: pastaId },
 *   ordemItens: { [pastaId]: [comunicadoId, ...] }
 * }
 */

const PASTA_GERAL = { id: '__geral__', nome: 'Geral', ordem: 9999 };

function getStorageKey() {
  const uid = (localStorage.getItem('usuario_id') || 'anonimo').replace(/['"]/g, '').trim();
  return `pastas_organizacao_${uid}`;
}

function carregarDoStorage() {
  try {
    const salvo = localStorage.getItem(getStorageKey());
    if (salvo) {
      const dados = JSON.parse(salvo);
      // Migração: garantir que todas as chaves de atribuicoes são strings
      if (dados.atribuicoes) {
        const novas = {};
        Object.entries(dados.atribuicoes).forEach(([k, v]) => {
          novas[String(k)] = v;
        });
        dados.atribuicoes = novas;
      }
      // Migração: garantir que ordemItens usa strings
      if (dados.ordemItens) {
        Object.keys(dados.ordemItens).forEach(pid => {
          dados.ordemItens[pid] = (dados.ordemItens[pid] || []).map(String);
        });
      }
      return dados;
    }
  } catch { /* ignore */ }
  return { pastas: [], atribuicoes: {}, ordemItens: {} };
}

function salvarNoStorage(dados) {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(dados));
  } catch { /* quota */ }
}

export function usePastas() {
  const [dados, setDados] = useState(carregarDoStorage);

  // Auto-save
  useEffect(() => {
    salvarNoStorage(dados);
  }, [dados]);

  // ── Pastas ──────────────────────────────────────────────────────────────────

  const criarPasta = useCallback((nome) => {
    setDados(prev => {
      const id = `pasta_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const ordem = prev.pastas.length;
      return { ...prev, pastas: [...prev.pastas, { id, nome, ordem }] };
    });
  }, []);

  const renomearPasta = useCallback((pastaId, novoNome) => {
    setDados(prev => ({
      ...prev,
      pastas: prev.pastas.map(p => p.id === pastaId ? { ...p, nome: novoNome } : p),
    }));
  }, []);

  const excluirPasta = useCallback((pastaId) => {
    setDados(prev => {
      // Mover itens da pasta excluída para "Geral"
      const novasAtribuicoes = { ...prev.atribuicoes };
      Object.entries(novasAtribuicoes).forEach(([itemId, pid]) => {
        if (pid === pastaId) delete novasAtribuicoes[itemId];
      });
      const novaOrdem = { ...prev.ordemItens };
      delete novaOrdem[pastaId];
      return {
        ...prev,
        pastas: prev.pastas.filter(p => p.id !== pastaId),
        atribuicoes: novasAtribuicoes,
        ordemItens: novaOrdem,
      };
    });
  }, []);

  const reordenarPastas = useCallback((pastaId, direcao) => {
    setDados(prev => {
      const pastas = [...prev.pastas].sort((a, b) => a.ordem - b.ordem);
      const idx = pastas.findIndex(p => p.id === pastaId);
      if (idx < 0) return prev;
      const alvo = direcao === 'up' ? idx - 1 : idx + 1;
      if (alvo < 0 || alvo >= pastas.length) return prev;
      [pastas[idx], pastas[alvo]] = [pastas[alvo], pastas[idx]];
      const reordenadas = pastas.map((p, i) => ({ ...p, ordem: i }));
      return { ...prev, pastas: reordenadas };
    });
  }, []);

  // ── Itens ───────────────────────────────────────────────────────────────────

  const moverParaPasta = useCallback((itemId, pastaId) => {
    const id = String(itemId);
    setDados(prev => {
      const novasAtribuicoes = { ...prev.atribuicoes };
      if (pastaId === '__geral__' || !pastaId) {
        delete novasAtribuicoes[id];
      } else {
        novasAtribuicoes[id] = pastaId;
      }
      // Remover de TODAS as listas de ordem
      const novaOrdem = { ...prev.ordemItens };
      Object.keys(novaOrdem).forEach(pid => {
        novaOrdem[pid] = (novaOrdem[pid] || []).filter(x => x !== id);
      });
      // Adicionar ao final da pasta destino
      if (pastaId && pastaId !== '__geral__') {
        novaOrdem[pastaId] = [...(novaOrdem[pastaId] || []), id];
      }
      return { ...prev, atribuicoes: novasAtribuicoes, ordemItens: novaOrdem };
    });
  }, []);

  const reordenarItem = useCallback((pastaId, itemId, direcao, todosItensDaPasta) => {
    const id = String(itemId);
    setDados(prev => {
      const chave = String(pastaId) || '__geral__';
      let lista = [...(prev.ordemItens[chave] || [])];
      
      // Se a lista está vazia ou incompleta, inicializar com todos os itens da pasta
      if (todosItensDaPasta && todosItensDaPasta.length > 0) {
        const idsExistentes = new Set(lista);
        todosItensDaPasta.forEach(itemIdPasta => {
          const sid = String(itemIdPasta);
          if (!idsExistentes.has(sid)) {
            lista.push(sid);
          }
        });
      }
      
      const idx = lista.indexOf(id);
      if (idx < 0) return prev;
      const alvo = direcao === 'up' ? idx - 1 : idx + 1;
      if (alvo < 0 || alvo >= lista.length) return prev;
      [lista[idx], lista[alvo]] = [lista[alvo], lista[idx]];
      return { ...prev, ordemItens: { ...prev.ordemItens, [chave]: lista } };
    });
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Retorna os comunicados organizados em pastas.
   * @param {Array} comunicados — lista original de comunicados
   * @returns {Array<{ pasta: {id, nome}, itens: Array }>}
   */
  const organizarEmPastas = useCallback((comunicados) => {
    const pastasOrdenadas = [...dados.pastas].sort((a, b) => a.ordem - b.ordem);
    const resultado = [];

    // Set de IDs já atribuídos a alguma pasta (converter tudo para string para comparação segura)
    const idsAtribuidos = new Set();

    // Pastas do usuário
    pastasOrdenadas.forEach(pasta => {
      const idsOrdenados = dados.ordemItens[pasta.id] || [];
      const itensNaPasta = comunicados.filter(c => {
        const cId = String(c.id);
        return String(dados.atribuicoes[cId]) === pasta.id;
      });
      // Marcar como atribuídos
      itensNaPasta.forEach(c => idsAtribuidos.add(String(c.id)));
      // Ordenar conforme a ordem salva
      itensNaPasta.sort((a, b) => {
        const ia = idsOrdenados.indexOf(String(a.id));
        const ib = idsOrdenados.indexOf(String(b.id));
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
      resultado.push({ pasta, itens: itensNaPasta });
    });

    // Pasta "Geral" — APENAS itens que NÃO estão em nenhuma pasta
    const itensGeral = comunicados.filter(c => !idsAtribuidos.has(String(c.id)));
    const ordemGeral = dados.ordemItens['__geral__'] || [];
    itensGeral.sort((a, b) => {
      const ia = ordemGeral.indexOf(String(a.id));
      const ib = ordemGeral.indexOf(String(b.id));
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    resultado.push({ pasta: PASTA_GERAL, itens: itensGeral });

    return resultado;
  }, [dados]);

  const getPastaDoComunicado = useCallback((comunicadoId) => {
    return dados.atribuicoes[String(comunicadoId)] || '__geral__';
  }, [dados]);

  const todasPastas = [...dados.pastas].sort((a, b) => a.ordem - b.ordem);
  todasPastas.push(PASTA_GERAL);

  return {
    pastas: todasPastas,
    pastasCustom: dados.pastas,
    criarPasta,
    renomearPasta,
    excluirPasta,
    reordenarPastas,
    moverParaPasta,
    reordenarItem,
    organizarEmPastas,
    getPastaDoComunicado,
  };
}
