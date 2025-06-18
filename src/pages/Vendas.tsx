import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Eye, CheckCircle, Clock, Settings } from 'lucide-react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDataStore } from '@/stores/data';
import { PixService, type PixProvider } from '@/services/pixService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Preço unitário correto por diamante
const DIAMOND_PRICE = 0.0689;

// Configurações PIX
const PIX_CONFIG = {
  chavePix: "kwai@agenciacheck.com", // Substitua pela sua chave PIX real
  nomeRecebedor: "Agencia Check",
  cidade: "SAO PAULO",
  cep: "01310-100"
};

// Configurações da API 4send
const API_TOKEN = "cm7domhw703b2q57w9fjaczfa";
const URL_CRIAR_LINK = "https://api.best4send.com/p/v1/links";

const vendaSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  revendedorId: z.string().min(1, 'Revendedor é obrigatório'),
  diamondQuantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
  kwaiId: z.string().optional(),
  pixProvider: z.enum(['4send', 'inter']),
  customerName: z.string().optional(),
  customerDocument: z.string().optional(),
  customerEmail: z.string().optional(),
  customerPhone: z.string().optional(),
});

type VendaForm = z.infer<typeof vendaSchema>;

interface NovaVendaDialogProps {
  open: boolean;
  onClose: () => void;
}

function NovaVendaDialog({ open, onClose }: NovaVendaDialogProps) {
  const { revendedores, addVenda } = useDataStore();
  const [generatingPayment, setGeneratingPayment] = useState(false);
  const [calculatedValue, setCalculatedValue] = useState(6.89);
  const [extractedKwaiId, setExtractedKwaiId] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const pixService = PixService;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<VendaForm>({
    resolver: zodResolver(vendaSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      diamondQuantity: 100,
      kwaiId: '',
      pixProvider: 'inter' as PixProvider,
      customerName: '',
      customerDocument: '',
      customerEmail: '',
      customerPhone: ''
    }
  });

  const diamondQuantity = watch('diamondQuantity');

  // Calcular valor automaticamente quando a quantidade mudar
  useEffect(() => {
    if (diamondQuantity && diamondQuantity > 0) {
      const newValue = Number((diamondQuantity * DIAMOND_PRICE).toFixed(2));
      setCalculatedValue(newValue);
    }
  }, [diamondQuantity]);

  const onSubmit: SubmitHandler<VendaForm> = (data) => {
    const selectedRevendedor = revendedores.find(r => r.id === data.revendedorId);
    addVenda({
      date: new Date(data.date),
      revendedorId: data.revendedorId,
      revendedorName: selectedRevendedor?.name || '',
      diamondQuantity: data.diamondQuantity,
      totalValue: calculatedValue,
      status: 'pendente',
      deliveryStatus: 'pendente',
      kwaiId: data.kwaiId || undefined,
    });
    reset();
    setCalculatedValue(6.89);
    onClose();
  };



  // Função para extrair Kwai ID do link (baseada no código testado)
  const extrairKwaiId = async (link: string): Promise<string | null> => {
    try {
      // Primeiro tenta extrair diretamente do URL se já contém o padrão
      const directMatch = link.match(/kwai\.com\/@([^"\/\?]+)/);
      if (directMatch) {
        console.log("Kwai ID extraído diretamente do URL:", directMatch[1]);
        return directMatch[1];
      }

      // Se não encontrou diretamente, faz fetch do conteúdo
      console.log("Fazendo fetch do link:", link);
      const response = await fetch(link, {
        mode: 'cors',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      const kwaiIdMatch = text.match(/kwai\.com\/@([^"\/\?]+)/);

      if (kwaiIdMatch) {
        console.log("Kwai ID extraído do conteúdo:", kwaiIdMatch[1]);
        return kwaiIdMatch[1];
      }

      console.log("Nenhum Kwai ID encontrado");
      return null;
    } catch (error) {
      console.error("Erro ao buscar Kwai ID:", error);
      return null;
    }
  };



  const generatePixPayment = async () => {
    const formData = watch();

    if (!formData.diamondQuantity || formData.diamondQuantity <= 0) {
      alert('⚠️ Preencha a quantidade de diamantes');
      return;
    }

    setGeneratingPayment(true);
    try {
      const pixData = {
        amount: calculatedValue,
        description: formData.kwaiId || "Compra de diamantes Kwai",
        customerName: formData.customerName,
        customerDocument: formData.customerDocument,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone
      };

      const pagamentoResponse = await pixService.createPayment(
        pixData,
        formData.pixProvider as PixProvider
      );

      if (!pagamentoResponse || !pagamentoResponse.paymentLink) {
        throw new Error("A API não retornou um link de pagamento válido.");
      }

      const linkPagamento = pagamentoResponse.paymentLink;
      const copyText = pagamentoResponse.qrCode || linkPagamento;

      // Copiar link para área de transferência
      await navigator.clipboard.writeText(copyText);

      const providerName = formData.pixProvider === 'inter' ? 'Banco Inter' : '4send';
      const expiryText = pagamentoResponse.expiresAt
        ? `⏰ Expira em: ${format(pagamentoResponse.expiresAt, 'dd/MM/yyyy HH:mm')}`
        : '';

      alert(`🎉 LINK PIX GERADO COM SUCESSO!

🏦 Provedor: ${providerName}
💰 Valor: R$ ${calculatedValue.toFixed(2)}
💎 Diamantes: ${formData.diamondQuantity}
${formData.kwaiId ? `🎯 Kwai ID: ${formData.kwaiId}` : ''}
${expiryText}

🔗 Link: ${linkPagamento}
${pagamentoResponse.qrCode ? '📋 QR Code disponível' : ''}

✅ ${pagamentoResponse.qrCode ? 'QR Code' : 'Link'} copiado para área de transferência!
Envie para o cliente fazer o pagamento.`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`❌ Erro ao gerar link PIX: ${errorMessage}`);
      console.error('Erro completo:', error);
    } finally {
      setGeneratingPayment(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Venda</DialogTitle>
          <DialogDescription>
            Registre uma nova venda de diamantes Kwai
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                {...register('date')}
                className={errors.date ? 'border-red-500' : ''}
              />
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="revendedor">Revendedor</Label>
              <Select onValueChange={(value) => setValue('revendedorId', value)}>
                <SelectTrigger className={errors.revendedorId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {revendedores.map(revendedor => (
                    <SelectItem key={revendedor.id} value={revendedor.id}>
                      {revendedor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.revendedorId && (
                <p className="text-sm text-red-500">{errors.revendedorId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="diamondQuantity">Quantidade de Diamantes</Label>
              <Input
                id="diamondQuantity"
                type="number"
                min="1"
                step="1"
                {...register('diamondQuantity', { valueAsNumber: true })}
                className={errors.diamondQuantity ? 'border-red-500' : ''}
              />
              {errors.diamondQuantity && (
                <p className="text-sm text-red-500">{errors.diamondQuantity.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Valor Total (Automático)</Label>
              <div className="px-3 py-2 bg-gray-100 border rounded-md">
                <span className="text-lg font-bold text-green-600">
                  R$ {calculatedValue.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Preço unitário: R$ {DIAMOND_PRICE.toFixed(4)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="kwaiLink">Link do Kwai</Label>
            <Input
              id="kwaiLink"
              placeholder="Ex: https://k.kwai.com/p/CLnqBMbp"
              onChange={async (e) => {
                const link = e.target.value.trim();
                if (link) {
                  const kwaiId = await extrairKwaiId(link);
                  if (kwaiId) {
                    setExtractedKwaiId(kwaiId);
                    setValue('kwaiId', kwaiId);
                  } else {
                    setExtractedKwaiId('');
                    setValue('kwaiId', '');
                  }
                } else {
                  setExtractedKwaiId('');
                  setValue('kwaiId', '');
                }
              }}
            />
            <div className="flex items-center gap-2 mt-2">
              <Label className="text-sm">Kwai ID extraído:</Label>
              <span className={`text-sm font-mono px-2 py-1 rounded ${extractedKwaiId ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-500'}`}>
                {extractedKwaiId || 'Nenhum ID detectado'}
              </span>
            </div>
            {/* Campo oculto para armazenar o kwaiId */}
            <input type="hidden" {...register('kwaiId')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pixProvider">Provedor PIX</Label>
            <Select onValueChange={(value: PixProvider) => setValue('pixProvider', value)} defaultValue="inter">
              <SelectTrigger>
                <SelectValue placeholder="Selecione o provedor PIX..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inter">🏦 Banco Inter (Recomendado)</SelectItem>
                <SelectItem value="4send">4send (Best4Send)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {showAdvancedOptions ? 'Ocultar' : 'Mostrar'} Opções Avançadas
            </Button>
          </div>

          {showAdvancedOptions && (
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
              <h4 className="font-medium text-sm text-gray-700">Dados do Cliente (Opcional)</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Nome do Cliente</Label>
                  <Input
                    id="customerName"
                    placeholder="Nome completo"
                    {...register('customerName')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerDocument">CPF</Label>
                  <Input
                    id="customerDocument"
                    placeholder="000.000.000-00"
                    {...register('customerDocument')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">E-mail</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="cliente@email.com"
                    {...register('customerEmail')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Telefone</Label>
                  <Input
                    id="customerPhone"
                    placeholder="(11) 99999-9999"
                    {...register('customerPhone')}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              onClick={generatePixPayment}
              disabled={generatingPayment}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {generatingPayment ? '⏳ Gerando...' : '💳 Gerar Pedido'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Vendas() {
  const { vendas, updateVendaStatus } = useDataStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pago' | 'pendente'>('all');

  const formatCurrency = (value: number | undefined) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    try {
      const validDate = typeof date === 'string' ? new Date(date) : date;
      if (!isValid(validDate)) {
        return 'Data inválida';
      }
      return format(validDate, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const filteredVendas = vendas.filter(venda => {
    const matchesSearch = venda.revendedorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venda.kwaiId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || venda.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalVendas = vendas.length;
  const vendasPagas = vendas.filter(v => v.status === 'pago').length;
  const vendasPendentes = vendas.filter(v => v.status === 'pendente').length;
  const receitaTotal = vendas.reduce((sum: number, v) => sum + v.totalValue, 0);
  const lucroTotal = vendas.reduce((sum: number, v) => sum + v.netProfit, 0);

  const getStatusBadge = (status: 'pago' | 'pendente') => {
    switch (status) {
      case 'pago':
        return <Badge className="bg-green-600">Pago</Badge>;
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getDeliveryStatusBadge = (status: 'pendente' | 'enviado' | 'entregue') => {
    switch (status) {
      case 'entregue':
        return <Badge className="bg-green-600">Entregue</Badge>;
      case 'enviado':
        return <Badge className="bg-blue-600">Enviado</Badge>;
      case 'pendente':
        return <Badge variant="secondary">Pendente</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Vendas</h1>
          <p className="text-slate-600 mt-1">
            Gerencie todas as vendas de diamantes
          </p>
        </div>

        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Venda
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 md:grid-cols-5"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <Eye className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVendas}</div>
            <p className="text-xs text-slate-600">Todas as vendas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Pagas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{vendasPagas}</div>
            <p className="text-xs text-slate-600">Confirmadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{vendasPendentes}</div>
            <p className="text-xs text-slate-600">Aguardando</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(receitaTotal)}</div>
            <p className="text-xs text-slate-600">Todas as vendas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(lucroTotal)}</div>
            <p className="text-xs text-slate-600">Lucro líquido</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-4 items-center"
      >
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por revendedor ou Kwai ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={(value: 'all' | 'pago' | 'pendente') => setStatusFilter(value)}>
          <SelectTrigger className="w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Lista de Vendas</CardTitle>
            <CardDescription>
              Histórico completo de vendas realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Revendedor</TableHead>
                    <TableHead>Kwai ID</TableHead>
                    <TableHead>Diamantes</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Lucro Líquido</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Entrega</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                        Nenhuma venda encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVendas.map(venda => (
                      <TableRow key={venda.id}>
                        <TableCell>
                          <div className="font-medium">
                            {formatDate(venda.date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{venda.revendedorName}</div>
                        </TableCell>
                        <TableCell>
                          {venda.kwaiId ? (
                            <div className="font-mono text-sm bg-blue-50 px-2 py-1 rounded">
                              {venda.kwaiId}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{(venda.diamondQuantity || 0).toLocaleString()}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{formatCurrency(venda.totalValue)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">{formatCurrency(venda.netProfit)}</span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(venda.status)}
                        </TableCell>
                        <TableCell>
                          {getDeliveryStatusBadge(venda.deliveryStatus)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateVendaStatus(
                              venda.id,
                              venda.status === 'pago' ? 'pendente' : 'pago'
                            )}
                          >
                            {venda.status === 'pago' ? 'Marcar Pendente' : 'Marcar Pago'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <NovaVendaDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
