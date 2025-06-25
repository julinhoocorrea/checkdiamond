import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  FileText,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';

import { useDataStore } from '@/stores/data';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function Relatorios() {
  const { vendas, revendedores, estoque } = useDataStore();
  const { user } = useAuthStore();

  const [dateRange, setDateRange] = useState('thisMonth');
  const [selectedRevendedor, setSelectedRevendedor] = useState('all');
  const [isLoadingBankData, setIsLoadingBankData] = useState(false);
  const [bankReconciliation, setBankReconciliation] = useState<{
    status: 'pending' | 'success' | 'error';
    differences: Array<{ type: string; amount: number; description: string }>;
  }>({ status: 'pending', differences: [] });

  // Calcular período baseado na seleção
  const dateFilter = useMemo(() => {
    const today = new Date();

    switch (dateRange) {
      case 'today':
        return { start: today, end: today };
      case 'thisWeek':
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const endOfWeek = new Date(today.setDate(startOfWeek.getDate() + 6));
        return { start: startOfWeek, end: endOfWeek };
      case 'thisMonth':
        return { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };
      case 'lastMonth':
        const lastMonth = subMonths(new Date(), 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'last3Months':
        return { start: subMonths(new Date(), 3), end: new Date() };
      default:
        return { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };
    }
  }, [dateRange]);

  // Filtrar vendas por período e revendedor
  const filteredVendas = useMemo(() => {
    return vendas.filter(venda => {
      const vendaDate = new Date(venda.date);
      const isInDateRange = isWithinInterval(vendaDate, dateFilter);
      const isRevendedorMatch = selectedRevendedor === 'all' || venda.revendedorId === selectedRevendedor;

      return isInDateRange && isRevendedorMatch;
    });
  }, [vendas, dateFilter, selectedRevendedor]);

  // Calcular métricas
  const metrics = useMemo(() => {
    const totalVendas = filteredVendas.length;
    const receitaTotal = filteredVendas.reduce((sum, v) => sum + v.totalValue, 0);
    const lucroTotal = filteredVendas.reduce((sum, v) => sum + v.netProfit, 0);
    const comissaoTotal = filteredVendas.reduce((sum, v) => sum + v.commission, 0);
    const diamantesVendidos = filteredVendas.reduce((sum, v) => sum + v.diamondQuantity, 0);

    const vendasPagas = filteredVendas.filter(v => v.status === 'pago');
    const receitaPaga = vendasPagas.reduce((sum, v) => sum + v.totalValue, 0);

    const ticketMedio = totalVendas > 0 ? receitaTotal / totalVendas : 0;
    const margemLucro = receitaTotal > 0 ? (lucroTotal / receitaTotal) * 100 : 0;

    return {
      totalVendas,
      receitaTotal,
      receitaPaga,
      lucroTotal,
      comissaoTotal,
      diamantesVendidos,
      ticketMedio,
      margemLucro,
      vendedoresAtivos: new Set(filteredVendas.map(v => v.revendedorId)).size
    };
  }, [filteredVendas]);

  // Dados por revendedor
  const dadosRevendedor = useMemo(() => {
    const dados = revendedores.map(revendedor => {
      const vendasRevendedor = filteredVendas.filter(v => v.revendedorId === revendedor.id);
      const totalVendas = vendasRevendedor.length;
      const receita = vendasRevendedor.reduce((sum, v) => sum + v.totalValue, 0);
      const comissao = vendasRevendedor.reduce((sum, v) => sum + v.commission, 0);
      const diamantes = vendasRevendedor.reduce((sum, v) => sum + v.diamondQuantity, 0);

      return {
        id: revendedor.id,
        nome: revendedor.name,
        totalVendas,
        receita,
        comissao,
        diamantes,
        ticketMedio: totalVendas > 0 ? receita / totalVendas : 0,
        isActive: revendedor.isActive
      };
    });

    return dados.sort((a, b) => b.receita - a.receita);
  }, [revendedores, filteredVendas]);

  // Dados de clientes (agregados por Kwai ID)
  const dadosClientes = useMemo(() => {
    const clientesMap = new Map();

    filteredVendas.forEach(venda => {
      const clienteKey = venda.kwaiId || venda.kwaiLink || 'Cliente Anônimo';
      const existing = clientesMap.get(clienteKey) || {
        id: clienteKey,
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

      clientesMap.set(clienteKey, existing);
    });

    return Array.from(clientesMap.values())
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .slice(0, 50); // Top 50 clientes
  }, [filteredVendas]);

  // Análise de estoque
  const analiseEstoque = useMemo(() => {
    const itensComEstoqueBaixo = estoque.items.filter(item => item.quantity < 10);
    const valorTotalEstoque = estoque.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const itensZerados = estoque.items.filter(item => item.quantity === 0);

    return {
      totalItens: estoque.items.length,
      valorTotal: valorTotalEstoque,
      itensEstoqueBaixo: itensComEstoqueBaixo.length,
      itensZerados: itensZerados.length,
      itensComEstoqueBaixo,
      itemMaisValioso: estoque.items.reduce((max, item) =>
        (item.quantity * item.price) > (max.quantity * max.price) ? item : max,
        estoque.items[0] || { name: 'N/A', quantity: 0, price: 0 }
      )
    };
  }, [estoque.items]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Exportar para Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Planilha de Resumo
    const resumoData = [
      ['RELATÓRIO GERAL - AGÊNCIA CHECK', ''],
      ['Período:', `${formatDate(dateFilter.start)} a ${formatDate(dateFilter.end)}`],
      ['Gerado em:', formatDate(new Date())],
      [''],
      ['MÉTRICAS GERAIS', ''],
      ['Total de Vendas', metrics.totalVendas.toString()],
      ['Receita Total', formatCurrency(metrics.receitaTotal)],
      ['Receita Paga', formatCurrency(metrics.receitaPaga)],
      ['Lucro Total', formatCurrency(metrics.lucroTotal)],
      ['Comissão Total', formatCurrency(metrics.comissaoTotal)],
      ['Diamantes Vendidos', metrics.diamantesVendidos.toLocaleString()],
      ['Ticket Médio', formatCurrency(metrics.ticketMedio)],
      ['Margem de Lucro', `${metrics.margemLucro.toFixed(2)}%`],
      ['Vendedores Ativos', metrics.vendedoresAtivos.toString()],
    ];

    const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

    // Planilha de Vendas
    const vendasData = [
      ['Data', 'Revendedor', 'Cliente/Kwai ID', 'Quantidade', 'Valor Total', 'Lucro', 'Comissão', 'Status', 'Entrega']
    ];

    filteredVendas.forEach(venda => {
      vendasData.push([
        formatDate(venda.date),
        venda.revendedorName,
        venda.kwaiId || venda.kwaiLink || 'N/A',
        venda.diamondQuantity.toString(),
        venda.totalValue.toString(),
        venda.netProfit.toString(),
        venda.commission.toString(),
        venda.status,
        venda.deliveryStatus
      ]);
    });

    const wsVendas = XLSX.utils.aoa_to_sheet(vendasData);
    XLSX.utils.book_append_sheet(wb, wsVendas, 'Vendas');

    // Planilha de Revendedores
    const revendedoresData = [
      ['Nome', 'Total Vendas', 'Receita', 'Comissão', 'Diamantes', 'Ticket Médio', 'Status']
    ];

    dadosRevendedor.forEach(rev => {
      revendedoresData.push([
        rev.nome,
        rev.totalVendas.toString(),
        rev.receita.toString(),
        rev.comissao.toString(),
        rev.diamantes.toString(),
        rev.ticketMedio.toString(),
        rev.isActive ? 'Ativo' : 'Inativo'
      ]);
    });

    const wsRevendedores = XLSX.utils.aoa_to_sheet(revendedoresData);
    XLSX.utils.book_append_sheet(wb, wsRevendedores, 'Revendedores');

    // Planilha de Clientes
    const clientesData = [
      ['Cliente/Kwai ID', 'Total Compras', 'Valor Total', 'Diamantes Total', 'Última Compra']
    ];

    dadosClientes.forEach(cliente => {
      clientesData.push([
        cliente.id,
        cliente.totalCompras.toString(),
        cliente.valorTotal.toString(),
        cliente.diamantesTotal.toString(),
        formatDate(cliente.ultimaCompra)
      ]);
    });

    const wsClientes = XLSX.utils.aoa_to_sheet(clientesData);
    XLSX.utils.book_append_sheet(wb, wsClientes, 'Top Clientes');

    // Planilha de Estoque
    const estoqueData = [
      ['Item', 'Descrição', 'Quantidade', 'Preço Unitário', 'Valor Total', 'Fornecedor']
    ];

    estoque.items.forEach(item => {
      estoqueData.push([
        item.name,
        item.description || 'N/A',
        item.quantity.toString(),
        item.price.toString(),
        (item.quantity * item.price).toString(),
        item.supplier || 'N/A'
      ]);
    });

    const wsEstoque = XLSX.utils.aoa_to_sheet(estoqueData);
    XLSX.utils.book_append_sheet(wb, wsEstoque, 'Estoque');

    // Salvar arquivo
    const fileName = `relatorio_agencia_check_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Simular reconciliação bancária
  const reconciliarBanco = async () => {
    setIsLoadingBankData(true);

    // Simular carregamento dos dados do Banco Inter
    setTimeout(() => {
      const receitaPagaReal = metrics.receitaPaga;
      const simulatedBankTotal = receitaPagaReal * (0.95 + Math.random() * 0.1); // Simular pequena diferença

      const differences = [];

      if (Math.abs(simulatedBankTotal - receitaPagaReal) > 1) {
        differences.push({
          type: 'divergencia',
          amount: simulatedBankTotal - receitaPagaReal,
          description: `Diferença entre extrato bancário (${formatCurrency(simulatedBankTotal)}) e sistema (${formatCurrency(receitaPagaReal)})`
        });
      }

      // Simular algumas transações pendentes
      if (filteredVendas.some(v => v.status === 'pendente')) {
        const pendingAmount = filteredVendas
          .filter(v => v.status === 'pendente')
          .reduce((sum, v) => sum + v.totalValue, 0);

        differences.push({
          type: 'pendente',
          amount: pendingAmount,
          description: `Vendas pendentes de confirmação (${formatCurrency(pendingAmount)})`
        });
      }

      setBankReconciliation({
        status: differences.length > 0 ? 'error' : 'success',
        differences
      });

      setIsLoadingBankData(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Relatórios Avançados</h1>
          <p className="text-slate-600 mt-1">
            Análise completa de vendas, revendedores, clientes e estoque
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={reconciliarBanco} variant="outline" className="gap-2" disabled={isLoadingBankData}>
            {isLoadingBankData ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Reconciliar Banco
          </Button>

          <Button onClick={exportToExcel} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Período</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="thisWeek">Esta Semana</SelectItem>
                    <SelectItem value="thisMonth">Este Mês</SelectItem>
                    <SelectItem value="lastMonth">Mês Passado</SelectItem>
                    <SelectItem value="last3Months">Últimos 3 Meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Revendedor</Label>
                <Select value={selectedRevendedor} onValueChange={setSelectedRevendedor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Revendedores</SelectItem>
                    {revendedores.map(rev => (
                      <SelectItem key={rev.id} value={rev.id}>
                        {rev.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <div className="text-sm text-slate-600">
                  <strong>Período selecionado:</strong><br />
                  {formatDate(dateFilter.start)} a {formatDate(dateFilter.end)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reconciliação Bancária */}
      {bankReconciliation.status !== 'pending' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Alert className={bankReconciliation.status === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {bankReconciliation.status === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription>
              <div className={bankReconciliation.status === 'success' ? 'text-green-800' : 'text-red-800'}>
                <strong>Reconciliação Bancária:</strong>
                {bankReconciliation.status === 'success' ? (
                  ' Dados do sistema conferem com o extrato bancário.'
                ) : (
                  ' Encontradas divergências:'
                )}

                {bankReconciliation.differences.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {bankReconciliation.differences.map((diff, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Badge variant={diff.type === 'pendente' ? 'secondary' : 'destructive'}>
                          {diff.amount > 0 ? '+' : ''}{formatCurrency(diff.amount)}
                        </Badge>
                        {diff.description}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Métricas Principais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid gap-4 md:grid-cols-4"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalVendas}</div>
            <p className="text-xs text-slate-600">
              {metrics.diamantesVendidos.toLocaleString()} diamantes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.receitaTotal)}</div>
            <p className="text-xs text-slate-600">
              {formatCurrency(metrics.receitaPaga)} confirmado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.lucroTotal)}</div>
            <p className="text-xs text-slate-600">
              Margem: {metrics.margemLucro.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.ticketMedio)}</div>
            <p className="text-xs text-slate-600">
              {metrics.vendedoresAtivos} vendedores ativos
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Relatório de Revendedores */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Performance por Revendedor
            </CardTitle>
            <CardDescription>
              Análise detalhada de vendas por revendedor no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Revendedor</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Receita</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Diamantes</TableHead>
                    <TableHead>Ticket Médio</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosRevendedor.map(rev => (
                    <TableRow key={rev.id}>
                      <TableCell className="font-medium">{rev.nome}</TableCell>
                      <TableCell>{rev.totalVendas}</TableCell>
                      <TableCell>{formatCurrency(rev.receita)}</TableCell>
                      <TableCell>{formatCurrency(rev.comissao)}</TableCell>
                      <TableCell>{rev.diamantes.toLocaleString()}</TableCell>
                      <TableCell>{formatCurrency(rev.ticketMedio)}</TableCell>
                      <TableCell>
                        <Badge variant={rev.isActive ? "default" : "secondary"}>
                          {rev.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Clientes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Clientes
            </CardTitle>
            <CardDescription>
              Maiores compradores no período selecionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente/Kwai ID</TableHead>
                    <TableHead>Compras</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Diamantes</TableHead>
                    <TableHead>Última Compra</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosClientes.slice(0, 10).map(cliente => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">
                        {cliente.id.length > 20 ? `${cliente.id.substring(0, 20)}...` : cliente.id}
                      </TableCell>
                      <TableCell>{cliente.totalCompras}</TableCell>
                      <TableCell>{formatCurrency(cliente.valorTotal)}</TableCell>
                      <TableCell>{cliente.diamantesTotal.toLocaleString()}</TableCell>
                      <TableCell>{formatDate(cliente.ultimaCompra)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Análise de Estoque */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid gap-4 md:grid-cols-2"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Análise de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold">{analiseEstoque.totalItens}</div>
                <p className="text-xs text-slate-600">Total de Itens</p>
              </div>
              <div>
                <div className="text-2xl font-bold">{formatCurrency(analiseEstoque.valorTotal)}</div>
                <p className="text-xs text-slate-600">Valor Total</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Estoque Baixo (&lt; 10):</span>
                <Badge variant={analiseEstoque.itensEstoqueBaixo > 0 ? "destructive" : "default"}>
                  {analiseEstoque.itensEstoqueBaixo} itens
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Itens Zerados:</span>
                <Badge variant={analiseEstoque.itensZerados > 0 ? "destructive" : "default"}>
                  {analiseEstoque.itensZerados} itens
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Item Mais Valioso:</span>
                <span className="text-sm font-medium">{analiseEstoque.itemMaisValioso.name}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {analiseEstoque.itensComEstoqueBaixo.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Alertas de Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analiseEstoque.itensComEstoqueBaixo.slice(0, 5).map(item => (
                  <div key={item.id} className="flex justify-between items-center">
                    <span className="text-sm">{item.name}</span>
                    <Badge variant="destructive">
                      {item.quantity} unidades
                    </Badge>
                  </div>
                ))}
                {analiseEstoque.itensComEstoqueBaixo.length > 5 && (
                  <p className="text-xs text-slate-500 text-center">
                    +{analiseEstoque.itensComEstoqueBaixo.length - 5} itens com estoque baixo
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
