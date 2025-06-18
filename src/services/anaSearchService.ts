import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Venda, Revendedor, EstoqueItem } from '@/types';

export interface SearchQuery {
  originalQuery: string;
  intent: 'vendas' | 'revendedores' | 'estoque' | 'clientes' | 'relatorios' | 'ajuda';
  parameters: Record<string, any>;
  confidence: number;
}

export interface SearchResult {
  type: string;
  title: string;
  data: any[];
  summary: string;
  actions?: Array<{ label: string; action: string }>;
}

export class AnaSearchService {
  private static instance: AnaSearchService;

  static getInstance(): AnaSearchService {
    if (!AnaSearchService.instance) {
      AnaSearchService.instance = new AnaSearchService();
    }
    return AnaSearchService.instance;
  }

  /**
   * Analisa a consulta do usuário e extrai intenção e parâmetros
   */
  parseQuery(query: string): SearchQuery {
    const normalizedQuery = query.toLowerCase().trim();

    // Patterns para diferentes tipos de busca
    const patterns = {
      vendas: [
        /vendas?\s+(do|da|de)\s+(.+)/,
        /vendas?\s+(hoje|ontem|semana|mês)/,
        /quanto\s+vendeu\s+(.+)/,
        /vendas?\s*$/,
        /faturamento/,
      ],
      revendedores: [
        /revendedor(es)?\s+(ativo|inativo)/,
        /revendedor(es)?\s+(do|da|de)\s+(.+)/,
        /quem\s+(vendeu|mais\s+vendeu)/,
        /performance\s+(.+)/,
        /revendedor(es)?\s*$/,
      ],
      estoque: [
        /estoque\s+(de|do)\s+(.+)/,
        /quanto\s+(tem|temos)\s+(de|do)\s+(.+)/,
        /estoque\s+(baixo|zerado)/,
        /estoque\s*$/,
        /produto(s)?\s+(.+)/,
      ],
      clientes: [
        /cliente(s)?\s+(que\s+mais\s+comprou|top)/,
        /cliente\s+(.+)/,
        /comprador(es)?\s*(.+)?/,
        /kwai\s+id\s+(.+)/,
      ],
      relatorios: [
        /relatório\s+(de|do)\s+(.+)/,
        /lucro\s+(do|da)\s+(.+)/,
        /receita\s+(do|da)\s+(.+)/,
        /margem/,
        /dre/,
      ]
    };

    // Determinar intenção
    let intent: SearchQuery['intent'] = 'ajuda';
    const parameters: Record<string, any> = {};
    let confidence = 0;

    for (const [intentType, intentPatterns] of Object.entries(patterns)) {
      for (const pattern of intentPatterns) {
        const match = normalizedQuery.match(pattern);
        if (match) {
          intent = intentType as SearchQuery['intent'];
          confidence = 0.8;

          // Extrair parâmetros específicos
          if (match[1]) parameters.target = match[1];
          if (match[2]) parameters.filter = match[2];
          if (match[3]) parameters.extra = match[3];

          // Parâmetros de tempo
          if (normalizedQuery.includes('hoje')) parameters.periodo = 'hoje';
          if (normalizedQuery.includes('ontem')) parameters.periodo = 'ontem';
          if (normalizedQuery.includes('semana')) parameters.periodo = 'semana';
          if (normalizedQuery.includes('mês') || normalizedQuery.includes('mes')) parameters.periodo = 'mes';

          break;
        }
      }
      if (confidence > 0) break;
    }

    return {
      originalQuery: query,
      intent,
      parameters,
      confidence
    };
  }

  /**
   * Executa a busca baseada na query analisada
   */
  async executeSearch(
    query: SearchQuery,
    data: {
      vendas: Venda[];
      revendedores: Revendedor[];
      estoque: EstoqueItem[];
    }
  ): Promise<SearchResult> {
    switch (query.intent) {
      case 'vendas':
        return this.searchVendas(query, data.vendas, data.revendedores);

      case 'revendedores':
        return this.searchRevendedores(query, data.revendedores, data.vendas);

      case 'estoque':
        return this.searchEstoque(query, data.estoque);

      case 'clientes':
        return this.searchClientes(query, data.vendas);

      case 'relatorios':
        return this.generateReport(query, data);

      default:
        return this.generateHelp();
    }
  }

  private searchVendas(query: SearchQuery, vendas: Venda[], revendedores: Revendedor[]): SearchResult {
    let filteredVendas = [...vendas];
    let summary = '';

    // Filtrar por revendedor específico
    if (query.parameters.target || query.parameters.filter) {
      const nomeRevendedor = query.parameters.target || query.parameters.filter;
      const revendedor = revendedores.find(r =>
        r.name.toLowerCase().includes(nomeRevendedor.toLowerCase())
      );

      if (revendedor) {
        filteredVendas = vendas.filter(v => v.revendedorId === revendedor.id);
        summary = `Vendas de ${revendedor.name}`;
      }
    }

    // Filtrar por período
    if (query.parameters.periodo) {
      const hoje = new Date();
      switch (query.parameters.periodo) {
        case 'hoje':
          filteredVendas = filteredVendas.filter(v => isToday(new Date(v.date)));
          summary = summary ? `${summary} de hoje` : 'Vendas de hoje';
          break;
        case 'semana':
          filteredVendas = filteredVendas.filter(v => isThisWeek(new Date(v.date)));
          summary = summary ? `${summary} desta semana` : 'Vendas desta semana';
          break;
        case 'mes':
          filteredVendas = filteredVendas.filter(v => isThisMonth(new Date(v.date)));
          summary = summary ? `${summary} deste mês` : 'Vendas deste mês';
          break;
      }
    }

    if (!summary) {
      summary = 'Todas as vendas encontradas';
    }

    const totalVendas = filteredVendas.length;
    const totalValor = filteredVendas.reduce((sum, v) => sum + v.totalValue, 0);
    const totalDiamantes = filteredVendas.reduce((sum, v) => sum + v.diamondQuantity, 0);

    return {
      type: 'vendas',
      title: summary,
      data: filteredVendas.slice(0, 10), // Limite de 10 resultados
      summary: `Encontrei ${totalVendas} vendas totalizando ${this.formatCurrency(totalValor)} e ${totalDiamantes.toLocaleString()} diamantes.`,
      actions: [
        { label: 'Ver Todas', action: '/vendas' },
        { label: 'Ver Relatórios', action: '/relatorios' }
      ]
    };
  }

  private searchRevendedores(query: SearchQuery, revendedores: Revendedor[], vendas: Venda[]): SearchResult {
    let filteredRevendedores = [...revendedores];
    let summary = '';

    // Filtrar por status
    if (query.parameters.target === 'ativo' || query.parameters.filter === 'ativo') {
      filteredRevendedores = revendedores.filter(r => r.isActive);
      summary = 'Revendedores ativos';
    } else if (query.parameters.target === 'inativo' || query.parameters.filter === 'inativo') {
      filteredRevendedores = revendedores.filter(r => !r.isActive);
      summary = 'Revendedores inativos';
    }

    // Buscar por nome específico
    if (query.parameters.target && !['ativo', 'inativo'].includes(query.parameters.target)) {
      const nome = query.parameters.target;
      filteredRevendedores = revendedores.filter(r =>
        r.name.toLowerCase().includes(nome.toLowerCase())
      );
      summary = `Revendedores com nome "${nome}"`;
    }

    // Calcular performance
    const revendedoresComPerformance = filteredRevendedores.map(revendedor => {
      const vendasRevendedor = vendas.filter(v => v.revendedorId === revendedor.id);
      const totalVendas = vendasRevendedor.length;
      const receita = vendasRevendedor.reduce((sum, v) => sum + v.totalValue, 0);

      return {
        ...revendedor,
        performance: {
          totalVendas,
          receita,
          ultimaVenda: vendasRevendedor.length > 0 ?
            Math.max(...vendasRevendedor.map(v => new Date(v.date).getTime())) : null
        }
      };
    });

    if (!summary) {
      summary = 'Revendedores encontrados';
    }

    return {
      type: 'revendedores',
      title: summary,
      data: revendedoresComPerformance,
      summary: `Encontrei ${filteredRevendedores.length} revendedores. ${filteredRevendedores.filter(r => r.isActive).length} estão ativos.`,
      actions: [
        { label: 'Ver Todos', action: '/revendedores' },
        { label: 'Ver Performance', action: '/relatorios' }
      ]
    };
  }

  private searchEstoque(query: SearchQuery, estoque: EstoqueItem[]): SearchResult {
    let filteredItems = [...estoque];
    let summary = '';

    // Buscar por nome do produto
    if (query.parameters.target || query.parameters.filter) {
      const produto = query.parameters.target || query.parameters.filter;
      filteredItems = estoque.filter(item =>
        item.name.toLowerCase().includes(produto.toLowerCase()) ||
        item.description?.toLowerCase().includes(produto.toLowerCase())
      );
      summary = `Estoque de "${produto}"`;
    }

    // Filtros especiais
    if (query.originalQuery.includes('baixo')) {
      filteredItems = estoque.filter(item => item.quantity < 10);
      summary = 'Itens com estoque baixo';
    } else if (query.originalQuery.includes('zerado')) {
      filteredItems = estoque.filter(item => item.quantity === 0);
      summary = 'Itens com estoque zerado';
    }

    if (!summary) {
      summary = 'Itens do estoque';
    }

    const totalItens = filteredItems.length;
    const valorTotal = filteredItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const quantidadeTotal = filteredItems.reduce((sum, item) => sum + item.quantity, 0);

    return {
      type: 'estoque',
      title: summary,
      data: filteredItems,
      summary: `Encontrei ${totalItens} itens no estoque com ${quantidadeTotal} unidades totais, valendo ${this.formatCurrency(valorTotal)}.`,
      actions: [
        { label: 'Ver Estoque', action: '/estoque' },
        { label: 'Adicionar Item', action: '/estoque' }
      ]
    };
  }

  private searchClientes(query: SearchQuery, vendas: Venda[]): SearchResult {
    // Agrupar vendas por cliente
    const clientesMap = new Map();

    vendas.forEach(venda => {
      const clienteId = venda.kwaiId || venda.kwaiLink || 'Cliente Anônimo';
      const existing = clientesMap.get(clienteId) || {
        id: clienteId,
        totalCompras: 0,
        valorTotal: 0,
        diamantesTotal: 0,
        ultimaCompra: venda.date
      };

      existing.totalCompras += 1;
      existing.valorTotal += venda.totalValue;
      existing.diamantesTotal += venda.diamondQuantity;

      if (new Date(venda.date) > new Date(existing.ultimaCompra)) {
        existing.ultimaCompra = venda.date;
      }

      clientesMap.set(clienteId, existing);
    });

    const clientes = Array.from(clientesMap.values())
      .sort((a, b) => b.valorTotal - a.valorTotal);

    let summary = 'Top clientes por valor de compras';
    let filteredClientes = clientes.slice(0, 10);

    // Buscar cliente específico
    if (query.parameters.target) {
      const busca = query.parameters.target.toLowerCase();
      filteredClientes = clientes.filter(c =>
        c.id.toLowerCase().includes(busca)
      );
      summary = `Clientes com ID "${query.parameters.target}"`;
    }

    return {
      type: 'clientes',
      title: summary,
      data: filteredClientes,
      summary: `Encontrei ${filteredClientes.length} clientes. O melhor cliente gastou ${this.formatCurrency(clientes[0]?.valorTotal || 0)}.`,
      actions: [
        { label: 'Ver Vendas', action: '/vendas' },
        { label: 'Ver Relatórios', action: '/relatorios' }
      ]
    };
  }

  private generateReport(query: SearchQuery, data: any): SearchResult {
    const { vendas, revendedores, estoque } = data;

    const totalVendas = vendas.length;
    const receitaTotal = vendas.reduce((sum: number, v: Venda) => sum + v.totalValue, 0);
    const lucroTotal = vendas.reduce((sum: number, v: Venda) => sum + v.netProfit, 0);
    const margemLucro = receitaTotal > 0 ? (lucroTotal / receitaTotal) * 100 : 0;

    const relatorio = {
      periodo: 'Geral',
      vendas: totalVendas,
      receita: receitaTotal,
      lucro: lucroTotal,
      margem: margemLucro,
      revendedoresAtivos: revendedores.filter((r: Revendedor) => r.isActive).length,
      valorEstoque: estoque.reduce((sum: number, item: EstoqueItem) => sum + (item.quantity * item.price), 0)
    };

    return {
      type: 'relatorio',
      title: 'Relatório Executivo',
      data: [relatorio],
      summary: `Receita total: ${this.formatCurrency(receitaTotal)}, Lucro: ${this.formatCurrency(lucroTotal)} (${margemLucro.toFixed(1)}% margem), ${totalVendas} vendas realizadas.`,
      actions: [
        { label: 'Ver Relatórios Completos', action: '/relatorios' },
        { label: 'Exportar Excel', action: '/relatorios' }
      ]
    };
  }

  private generateHelp(): SearchResult {
    const exemplos = [
      'Ana, vendas do João',
      'Ana, revendedores ativos',
      'Ana, estoque de diamantes',
      'Ana, cliente que mais comprou',
      'Ana, vendas de hoje',
      'Ana, lucro do mês',
      'Ana, estoque baixo',
      'Ana, relatório geral'
    ];

    return {
      type: 'ajuda',
      title: 'Como posso te ajudar?',
      data: exemplos.map(exemplo => ({ exemplo })),
      summary: 'Posso buscar informações sobre vendas, revendedores, estoque, clientes e gerar relatórios. Experimente perguntar algo!',
      actions: [
        { label: 'Ver Dashboard', action: '/dashboard' },
        { label: 'Ver Relatórios', action: '/relatorios' }
      ]
    };
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Gera resposta em linguagem natural
   */
  generateNaturalResponse(result: SearchResult): string {
    const responses = {
      vendas: [
        `Encontrei ${result.data.length} vendas para você.`,
        `Aqui estão as vendas que você pediu.`,
        `Localizei essas vendas no sistema.`
      ],
      revendedores: [
        `Aqui estão os revendedores que você procurava.`,
        `Encontrei esses revendedores no sistema.`,
        `Estes são os revendedores correspondentes.`
      ],
      estoque: [
        `Aqui está o estoque que você solicitou.`,
        `Encontrei esses itens no estoque.`,
        `Estes são os produtos disponíveis.`
      ],
      clientes: [
        `Aqui estão os clientes encontrados.`,
        `Estes são os principais clientes.`,
        `Encontrei esses compradores.`
      ],
      relatorio: [
        `Aqui está o relatório solicitado.`,
        `Preparei este resumo para você.`,
        `Estes são os dados que você pediu.`
      ],
      ajuda: [
        `Estou aqui para ajudar! Veja alguns exemplos do que posso fazer.`,
        `Posso buscar várias informações no sistema para você.`,
        `Experimente me perguntar sobre vendas, estoque ou relatórios.`
      ]
    };

    const typeResponses = responses[result.type as keyof typeof responses] || responses.ajuda;
    const randomResponse = typeResponses[Math.floor(Math.random() * typeResponses.length)];

    return `${randomResponse} ${result.summary}`;
  }
}
