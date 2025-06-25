import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Copy,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  QrCode,
  TrendingUp,
  DollarSign,
  Calendar,
  RefreshCw
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PixService, type PixProvider, type PixPaymentResponse } from '@/services/pixService';

// Schema para validação do formulário
const paymentFormSchema = z.object({
  amount: z.string().min(1, 'Valor é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  customerName: z.string().optional(),
  customerDocument: z.string().optional(),
  customerEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  customerPhone: z.string().optional(),
  externalId: z.string().optional(),
  expiresIn: z.string().optional(),
  pixProvider: z.enum(['inter', '4send'])
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface PaymentRecord extends PixPaymentResponse {
  createdAt: Date;
}

export function Pagamentos() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      pixProvider: 'inter',
      expiresIn: '30'
    }
  });

  const watchedProvider = watch('pixProvider');

  // Carregar pagamentos do localStorage
  useEffect(() => {
    const savedPayments = localStorage.getItem('pixPayments');
    if (savedPayments) {
      try {
        const parsed = JSON.parse(savedPayments).map((payment: any) => ({
          ...payment,
          createdAt: new Date(payment.createdAt),
          expiresAt: payment.expiresAt ? new Date(payment.expiresAt) : undefined,
          paidAt: payment.paidAt ? new Date(payment.paidAt) : undefined
        }));
        setPayments(parsed);
      } catch (error) {
        console.error('Erro ao carregar pagamentos:', error);
      }
    }
  }, []);

  // Filtrar pagamentos
  useEffect(() => {
    let filtered = payments;

    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.amount.toString().includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    setFilteredPayments(filtered);
  }, [payments, searchTerm, statusFilter]);

  // Salvar pagamentos no localStorage
  const savePayments = (newPayments: PaymentRecord[]) => {
    localStorage.setItem('pixPayments', JSON.stringify(newPayments));
    setPayments(newPayments);
  };

  // Gerar nova cobrança PIX
  const onSubmit = async (data: PaymentFormData) => {
    setIsGenerating(true);

    try {
      const paymentData = {
        amount: Number.parseFloat(data.amount.replace(',', '.')),
        description: data.description,
        customerName: data.customerName,
        customerDocument: data.customerDocument,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        externalId: data.externalId || `PAY-${Date.now()}`,
        expiresIn: data.expiresIn ? Number.parseInt(data.expiresIn) : undefined
      };

      const response = await PixService.createPayment(paymentData, data.pixProvider);

      const newPayment: PaymentRecord = {
        ...response,
        createdAt: new Date()
      };

      const updatedPayments = [newPayment, ...payments];
      savePayments(updatedPayments);

      toast.success(`🎉 Cobrança PIX criada com sucesso!`, {
        description: `Valor: R$ ${Number.parseFloat(data.amount.replace(',', '.')).toFixed(2)} via ${data.pixProvider === 'inter' ? 'Banco Inter' : '4send'}`
      });

      reset();
      setIsCreateDialogOpen(false);

    } catch (error) {
      console.error('Erro ao criar cobrança PIX:', error);
      toast.error('❌ Erro ao criar cobrança PIX', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Copiar código PIX
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado para a área de transferência!`);
  };

  // Atualizar status do pagamento
  const refreshPaymentStatus = async (paymentId: string) => {
    // Simular atualização de status (em produção, viria da API)
    const updated = payments.map(payment => {
      if (payment.id === paymentId && payment.status === 'pending') {
        // Simular possível mudança de status
        const randomStatus = Math.random() > 0.7 ? 'paid' : 'pending';
        return {
          ...payment,
          status: randomStatus as any,
          paidAt: randomStatus === 'paid' ? new Date() : undefined
        };
      }
      return payment;
    });

    savePayments(updated);
    toast.info('Status do pagamento atualizado');
  };

  // Obter estatísticas
  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.status === 'pending').length,
    paid: payments.filter(p => p.status === 'paid').length,
    expired: payments.filter(p => p.status === 'expired').length,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    paidAmount: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendente' },
      paid: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Pago' },
      expired: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Expirado' },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelado' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">💳 Pagamentos PIX</h1>
          <p className="text-slate-600 mt-1">Gerencie suas cobranças PIX</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Nova Cobrança PIX
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>🔥 Criar Nova Cobrança PIX</DialogTitle>
              <DialogDescription>
                Gere uma cobrança PIX para receber pagamentos
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Valor (R$) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    {...register('amount')}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-600 mt-1">{errors.amount.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="pixProvider">Provedor PIX *</Label>
                  <Select
                    onValueChange={(value: PixProvider) => setValue('pixProvider', value)}
                    defaultValue="inter"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o provedor..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inter">🏦 Banco Inter</SelectItem>
                      <SelectItem value="4send">💼 4send</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Input
                  id="description"
                  placeholder="Descrição do pagamento..."
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Nome do Cliente</Label>
                  <Input
                    id="customerName"
                    placeholder="Nome completo..."
                    {...register('customerName')}
                  />
                </div>

                <div>
                  <Label htmlFor="customerDocument">CPF/CNPJ</Label>
                  <Input
                    id="customerDocument"
                    placeholder="000.000.000-00"
                    {...register('customerDocument')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="cliente@email.com"
                    {...register('customerEmail')}
                  />
                  {errors.customerEmail && (
                    <p className="text-sm text-red-600 mt-1">{errors.customerEmail.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerPhone">Telefone</Label>
                  <Input
                    id="customerPhone"
                    placeholder="(11) 99999-9999"
                    {...register('customerPhone')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="externalId">ID Externo</Label>
                  <Input
                    id="externalId"
                    placeholder="Deixe vazio para auto-gerar"
                    {...register('externalId')}
                  />
                </div>

                <div>
                  <Label htmlFor="expiresIn">Expira em (minutos)</Label>
                  <Input
                    id="expiresIn"
                    type="number"
                    placeholder="30"
                    {...register('expiresIn')}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4 mr-2" />
                      Gerar Cobrança PIX
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cobranças</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              cobranças criadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            <p className="text-xs text-muted-foreground">
              pagamentos recebidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Recebido</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats.paidAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              de R$ {stats.totalAmount.toFixed(2)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição, ID ou valor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Cobranças PIX</CardTitle>
          <CardDescription>
            Lista de todas as cobranças PIX criadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhuma cobrança encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                {payments.length === 0
                  ? 'Comece criando sua primeira cobrança PIX.'
                  : 'Tente ajustar os filtros para encontrar cobranças.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Provedor</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono text-sm">
                        {payment.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>{payment.description}</TableCell>
                      <TableCell className="font-semibold">
                        R$ {payment.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.status)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.provider === 'inter' ? '🏦 Inter' : '💼 4send'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.createdAt.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {payment.qrCode && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(payment.qrCode!, 'Código PIX')}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          )}

                          {payment.paymentLink && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(payment.paymentLink, '_blank')}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}

                          {payment.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => refreshPaymentStatus(payment.id)}
                            >
                              <RefreshCw className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aviso de Configuração */}
      {payments.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            💡 <strong>Dica:</strong> Configure suas credenciais PIX na página de <strong>Configurações</strong>
            antes de criar cobranças. Você pode usar o Banco Inter ou 4send como provedor.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
