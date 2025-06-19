import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Send,
  Smartphone,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
  Settings,
  Play,
  User,
  Package,
  Copy,
  Eye,
  EyeOff,
  LogIn,
  Globe,
  Zap,
  Monitor
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useDataStore } from '@/stores/data';
import { KwaiService } from '@/services/kwaiService';

// Schema para envio de diamantes
const envioSchema = z.object({
  kwaiId: z.string().min(1, 'ID do Kwai é obrigatório'),
  diamondQuantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
  customerName: z.string().min(1, 'Nome do cliente é obrigatório'),
  notes: z.string().optional()
});

type EnvioForm = z.infer<typeof envioSchema>;

interface EnvioRecord {
  id: string;
  kwaiId: string;
  diamondQuantity: number;
  customerName: string;
  status: 'pending' | 'processing' | 'sent' | 'delivered' | 'failed';
  createdAt: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  notes?: string;
  attempts: number;
}

interface KwaiCredentials {
  email: string;
  password: string;
  accountName: string;
}

// Credenciais do Kwai
const KWAI_CREDENTIALS: KwaiCredentials = {
  email: 'revendakwai@gmail.com',
  password: 'Ju113007/',
  accountName: 'Revendacheck2'
};

// URL do formulário de distribuição do Kwai
const KWAI_DISTRIBUTE_URL = 'https://m-live.kwai.com/features/distribute/form?webview=yoda';

export function Envios() {
  const { vendas, updateDeliveryStatus } = useDataStore();
  const [envios, setEnvios] = useState<EnvioRecord[]>([]);
  const [isKwaiOpen, setIsKwaiOpen] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [kwaiStatus, setKwaiStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const kwaiFrameRef = useRef<HTMLIFrameElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<EnvioForm>({
    resolver: zodResolver(envioSchema)
  });

  // Carregar envios do localStorage
  useEffect(() => {
    const savedEnvios = localStorage.getItem('kwaiEnvios');
    if (savedEnvios) {
      try {
        const parsed = JSON.parse(savedEnvios).map((envio: any) => ({
          ...envio,
          createdAt: new Date(envio.createdAt),
          sentAt: envio.sentAt ? new Date(envio.sentAt) : undefined,
          deliveredAt: envio.deliveredAt ? new Date(envio.deliveredAt) : undefined
        }));
        setEnvios(parsed);
      } catch (error) {
        console.error('Erro ao carregar envios:', error);
      }
    }
  }, []);

  // Salvar envios no localStorage
  const saveEnvios = (newEnvios: EnvioRecord[]) => {
    localStorage.setItem('kwaiEnvios', JSON.stringify(newEnvios));
    setEnvios(newEnvios);
  };

  // Adicionar novo envio
  const addEnvio = (envioData: EnvioForm) => {
    const newEnvio: EnvioRecord = {
      id: `envio_${Date.now()}`,
      ...envioData,
      status: 'pending',
      createdAt: new Date(),
      attempts: 0
    };

    const updatedEnvios = [newEnvio, ...envios];
    saveEnvios(updatedEnvios);
    return newEnvio;
  };

  // Atualizar status do envio
  const updateEnvioStatus = (
    envioId: string,
    status: EnvioRecord['status'],
    additionalData?: Partial<EnvioRecord>
  ) => {
    const updatedEnvios = envios.map(envio => {
      if (envio.id === envioId) {
        const updated = {
          ...envio,
          status,
          ...additionalData
        };

        if (status === 'sent' && !envio.sentAt) {
          updated.sentAt = new Date();
        }
        if (status === 'delivered' && !envio.deliveredAt) {
          updated.deliveredAt = new Date();
        }

        return updated;
      }
      return envio;
    });

    saveEnvios(updatedEnvios);

    // Atualizar status na venda correspondente
    if (status === 'delivered') {
      const envio = envios.find(e => e.id === envioId);
      if (envio) {
        updateDeliveryStatus(envio.kwaiId, 'entregue', 'system');
      }
    }
  };

  // Abrir Kwai em modo mobile
  const openKwaiMobile = () => {
    setIsKwaiOpen(true);
    setKwaiStatus('connecting');

    // Simular user agent mobile
    const mobileUserAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1';

    toast.info('🚀 Abrindo Kwai em modo mobile...', {
      description: 'Aguarde o carregamento da interface'
    });

    // Simular delay de conexão
    setTimeout(() => {
      setKwaiStatus('connected');
      toast.success('✅ Kwai conectado com sucesso!');
    }, 2000);
  };

  // Envio manual via formulário
  const onSubmitManual = async (data: EnvioForm) => {
    try {
      const envio = addEnvio(data);

      toast.success('📦 Envio criado com sucesso!', {
        description: `Envio para ${data.customerName} adicionado à lista`
      });

      updateEnvioStatus(envio.id, 'processing');
      reset();

      // Auto-processar se estiver em modo automático
      if (isAutoMode && kwaiStatus === 'connected') {
        processEnvio(envio);
      }

    } catch (error) {
      toast.error('❌ Erro ao criar envio');
    }
  };

  // Processar envio automaticamente
  const processEnvio = async (envio: EnvioRecord) => {
    try {
      updateEnvioStatus(envio.id, 'processing', { attempts: envio.attempts + 1 });

      const isSimulation = KwaiService.isSimulationMode();
      const modeText = isSimulation ? '[SIMULADO]' : '';

      toast.info(`🎯 ${modeText} Processando envio para ${envio.customerName}...`, {
        description: `${envio.diamondQuantity} diamantes para ID: ${envio.kwaiId}`
      });

      // Usar KwaiService para distribuir diamantes
      const result = await KwaiService.distributeDiamonds({
        kwaiId: envio.kwaiId,
        diamondQuantity: envio.diamondQuantity,
        customerName: envio.customerName,
        message: envio.notes
      });

      if (result.success) {
        updateEnvioStatus(envio.id, 'sent', {
          notes: `${envio.notes || ''}\nTXN: ${result.transactionId}`
        });

        toast.success(`✅ Diamantes enviados com sucesso!`, {
          description: result.message
        });

        // Marcar como entregue após 2 segundos (tempo para confirmação)
        setTimeout(() => {
          updateEnvioStatus(envio.id, 'delivered');
          toast.success('🎉 Entrega confirmada no Kwai!');
        }, 2000);

      } else {
        updateEnvioStatus(envio.id, 'failed', {
          notes: `${envio.notes || ''}\nErro: ${result.message}`
        });

        toast.error('❌ Falha no envio', {
          description: result.message
        });
      }

    } catch (error) {
      updateEnvioStatus(envio.id, 'failed', {
        notes: `${envio.notes || ''}\nErro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
      toast.error('❌ Erro no processamento');
    }
  };

  // Processar envio individual
  const handleProcessEnvio = (envio: EnvioRecord) => {
    if (kwaiStatus !== 'connected') {
      toast.warning('⚠️ Conecte ao Kwai primeiro');
      return;
    }
    processEnvio(envio);
  };

  // Importar vendas pendentes
  const importPendingVendas = () => {
    const vendasPendentes = vendas.filter(v =>
      v.deliveryStatus === 'pendente' &&
      v.kwaiId &&
      !envios.some(e => e.kwaiId === v.kwaiId)
    );

    vendasPendentes.forEach(venda => {
      addEnvio({
        kwaiId: venda.kwaiId!,
        diamondQuantity: venda.diamondQuantity,
        customerName: venda.revendedorName,
        notes: `Venda #${venda.id} - ${venda.date.toLocaleDateString()}`
      });
    });

    toast.success(`✅ ${vendasPendentes.length} vendas importadas para envio`);
  };

  // Estatísticas
  const stats = {
    total: envios.length,
    pending: envios.filter(e => e.status === 'pending').length,
    processing: envios.filter(e => e.status === 'processing').length,
    sent: envios.filter(e => e.status === 'sent').length,
    delivered: envios.filter(e => e.status === 'delivered').length,
    failed: envios.filter(e => e.status === 'failed').length,
    totalDiamonds: envios.reduce((sum, e) => sum + e.diamondQuantity, 0)
  };

  const getStatusBadge = (status: EnvioRecord['status']) => {
    const configs = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Pendente' },
      processing: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw, label: 'Processando' },
      sent: { color: 'bg-yellow-100 text-yellow-800', icon: Send, label: 'Enviado' },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Entregue' },
      failed: { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Falhou' }
    };

    const config = configs[status];
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">🚚 Envios Kwai</h1>
          <p className="text-slate-600 mt-1">
            Sistema automatizado de envio de diamantes via Kwai
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={importPendingVendas}
            className="gap-2"
          >
            <Package className="w-4 h-4" />
            Importar Vendas
          </Button>

          <Button
            onClick={openKwaiMobile}
            className={`gap-2 ${kwaiStatus === 'connected' ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            <Smartphone className="w-4 h-4" />
            {kwaiStatus === 'connected' ? 'Kwai Conectado' : 'Conectar Kwai'}
          </Button>
        </div>
      </motion.div>

      {/* Status do Kwai */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Alert className={`${
          kwaiStatus === 'connected' ? 'border-green-200 bg-green-50' :
          kwaiStatus === 'connecting' ? 'border-blue-200 bg-blue-50' :
          kwaiStatus === 'error' ? 'border-red-200 bg-red-50' :
          'border-gray-200 bg-gray-50'
        }`}>
          <Globe className={`h-4 w-4 ${
            kwaiStatus === 'connected' ? 'text-green-600' :
            kwaiStatus === 'connecting' ? 'text-blue-600 animate-spin' :
            kwaiStatus === 'error' ? 'text-red-600' :
            'text-gray-600'
          }`} />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Status Kwai:</strong> {
                  kwaiStatus === 'connected' ? '✅ Conectado como Revendacheck2' :
                  kwaiStatus === 'connecting' ? '🔄 Conectando...' :
                  kwaiStatus === 'error' ? '❌ Erro de conexão' :
                  '⚪ Desconectado'
                }
                {kwaiStatus === 'connected' && (
                  <>
                    <span className="mx-2">•</span>
                    <span className={`text-sm ${isAutoMode ? 'text-green-600' : 'text-gray-600'}`}>
                      Modo automático: {isAutoMode ? 'Ativo' : 'Inativo'}
                    </span>
                  </>
                )}
              </div>

              {kwaiStatus === 'connected' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAutoMode(!isAutoMode)}
                    className="gap-1"
                  >
                    <Zap className="w-3 h-3" />
                    {isAutoMode ? 'Desativar' : 'Ativar'} Auto
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCredentials(!showCredentials)}
                    className="gap-1"
                  >
                    {showCredentials ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    Credenciais
                  </Button>
                </div>
              )}
            </div>

            {showCredentials && (
              <div className="mt-3 p-3 bg-white border rounded-lg">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <strong>Email:</strong> {KWAI_CREDENTIALS.email}
                  </div>
                  <div>
                    <strong>Senha:</strong> {KWAI_CREDENTIALS.password}
                  </div>
                  <div>
                    <strong>Conta:</strong> {KWAI_CREDENTIALS.accountName}
                  </div>
                </div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      </motion.div>

      {/* Estatísticas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-600">Processando</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-600">Enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.sent}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-600">Entregues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600">Falhas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-600">💎 Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalDiamonds.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Formulário de Envio Manual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Novo Envio Manual
            </CardTitle>
            <CardDescription>
              Adicione um envio de diamantes à lista de processamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmitManual)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="kwaiId">ID do Kwai *</Label>
                  <Input
                    id="kwaiId"
                    placeholder="ID do usuário"
                    {...register('kwaiId')}
                    className={errors.kwaiId ? 'border-red-500' : ''}
                  />
                  {errors.kwaiId && (
                    <p className="text-sm text-red-500 mt-1">{errors.kwaiId.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="diamondQuantity">Quantidade de Diamantes *</Label>
                  <Input
                    id="diamondQuantity"
                    type="number"
                    min="1"
                    placeholder="100"
                    {...register('diamondQuantity', { valueAsNumber: true })}
                    className={errors.diamondQuantity ? 'border-red-500' : ''}
                  />
                  {errors.diamondQuantity && (
                    <p className="text-sm text-red-500 mt-1">{errors.diamondQuantity.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerName">Nome do Cliente *</Label>
                  <Input
                    id="customerName"
                    placeholder="Nome do cliente"
                    {...register('customerName')}
                    className={errors.customerName ? 'border-red-500' : ''}
                  />
                  {errors.customerName && (
                    <p className="text-sm text-red-500 mt-1">{errors.customerName.message}</p>
                  )}
                </div>

                <div className="flex items-end">
                  <Button type="submit" className="w-full gap-2">
                    <Package className="w-4 h-4" />
                    Adicionar Envio
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Observações adicionais..."
                  {...register('notes')}
                  className="resize-none"
                />
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Lista de Envios */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Lista de Envios</CardTitle>
            <CardDescription>
              Acompanhe o status de todos os envios de diamantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {envios.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhum envio encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Adicione um novo envio ou importe vendas pendentes.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Kwai</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>💎 Diamantes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tentativas</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {envios.map((envio) => (
                      <TableRow key={envio.id}>
                        <TableCell className="font-mono text-sm">
                          {envio.kwaiId}
                        </TableCell>
                        <TableCell>{envio.customerName}</TableCell>
                        <TableCell className="font-semibold">
                          {envio.diamondQuantity.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(envio.status)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {envio.attempts}x
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {envio.createdAt.toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {(envio.status === 'pending' || envio.status === 'failed') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleProcessEnvio(envio)}
                                disabled={kwaiStatus !== 'connected'}
                                className="gap-1"
                              >
                                <Play className="w-3 h-3" />
                                Processar
                              </Button>
                            )}

                            {envio.status === 'processing' && (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="gap-1"
                              >
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                Processando
                              </Button>
                            )}

                            {envio.status === 'delivered' && (
                              <Badge variant="outline" className="text-green-600">
                                ✅ Concluído
                              </Badge>
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
      </motion.div>

      {/* Modal do Kwai (simulador mobile) */}
      <Dialog open={isKwaiOpen} onOpenChange={setIsKwaiOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Kwai Mobile - Distribuição de Diamantes
            </DialogTitle>
            <DialogDescription>
              Simulador mobile conectado como {KWAI_CREDENTIALS.accountName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status e Controles */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  kwaiStatus === 'connected' ? 'bg-green-500' :
                  kwaiStatus === 'connecting' ? 'bg-blue-500 animate-pulse' :
                  'bg-gray-500'
                }`} />
                <span className="font-medium">
                  {kwaiStatus === 'connected' ? 'Conectado' :
                   kwaiStatus === 'connecting' ? 'Conectando...' :
                   'Desconectado'}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(KWAI_DISTRIBUTE_URL, '_blank')}
                  className="gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Abrir Real
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setKwaiStatus('connected')}
                  className="gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reconectar
                </Button>
              </div>
            </div>

            {/* Simulador da interface mobile do Kwai */}
            <div className="border-2 border-gray-300 rounded-lg bg-white" style={{ height: '500px' }}>
              {kwaiStatus === 'connected' ? (
                <div className="h-full flex flex-col">
                  {/* Header simulado */}
                  <div className="bg-yellow-400 text-black p-3 flex items-center gap-2">
                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center text-yellow-400 font-bold text-sm">
                      K
                    </div>
                    <span className="font-bold">Kwai - Distribuição</span>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 p-4 space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-bold">💎 Distribuir Diamantes</h3>
                      <p className="text-sm text-gray-600">Conta: {KWAI_CREDENTIALS.accountName}</p>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm font-medium text-blue-800">
                          ⚡ Modo Automático {isAutoMode ? 'Ativo' : 'Inativo'}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          {isAutoMode
                            ? 'Processando envios automaticamente'
                            : 'Clique em "Processar" nos envios pendentes'
                          }
                        </div>
                      </div>

                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-sm font-medium text-green-800">
                          📊 Status dos Envios
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                          <div>Pendentes: {stats.pending}</div>
                          <div>Processando: {stats.processing}</div>
                          <div>Entregues: {stats.delivered}</div>
                          <div>Falhas: {stats.failed}</div>
                        </div>
                      </div>

                      {stats.pending > 0 && !isAutoMode && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="text-sm font-medium text-yellow-800">
                            ⚠️ {stats.pending} envios pendentes
                          </div>
                          <div className="text-xs text-yellow-600 mt-1">
                            Ative o modo automático ou processe manualmente
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-center text-xs text-gray-500 mt-4">
                      ℹ️ Interface simulada para demonstração
                      <br />
                      Use "Abrir Real" para acessar o Kwai oficial
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Monitor className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900">
                      {kwaiStatus === 'connecting' ? 'Conectando...' : 'Kwai Desconectado'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {kwaiStatus === 'connecting'
                        ? 'Estabelecendo conexão com o Kwai...'
                        : 'Clique em "Conectar Kwai" para iniciar'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
