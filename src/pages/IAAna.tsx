import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, MessageCircle, Settings, Zap, Phone, Clock, CheckCircle, Search, Send, Mic, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AnaSearchService, type SearchResult } from '@/services/anaSearchService';
import { useDataStore } from '@/stores/data';

const configSchema = z.object({
  whatsappNumber: z.string().min(10, 'Número do WhatsApp é obrigatório'),
  businessName: z.string().min(1, 'Nome do negócio é obrigatório'),
  welcomeMessage: z.string().min(1, 'Mensagem de boas-vindas é obrigatória'),
  paymentInstructions: z.string().min(1, 'Instruções de pagamento são obrigatórias'),
  businessHours: z.string().min(1, 'Horário de funcionamento é obrigatório'),
});

type ConfigForm = z.infer<typeof configSchema>;

export function IAAna() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{
    type: 'user' | 'ana';
    message: string;
    result?: SearchResult;
    timestamp: Date;
  }>>([
    {
      type: 'ana',
      message: '🤖 Olá! Eu sou a Ana, sua assistente inteligente. Posso ajudar você a buscar informações sobre vendas, revendedores, estoque, clientes e relatórios. Como posso te ajudar hoje?',
      timestamp: new Date()
    }
  ]);

  const { vendas, revendedores, estoque } = useDataStore();
  const anaSearchService = AnaSearchService.getInstance();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ConfigForm>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      whatsappNumber: '',
      businessName: 'Agência Check',
      welcomeMessage: '🎉 Olá! Bem-vindo à Agência Check!\n\nSou a Ana, sua assistente virtual. Estou aqui para ajudar você com:\n• 💎 Compra de diamantes Kwai\n• 📦 Acompanhamento de pedidos\n• 💳 Informações sobre pagamento\n• ❓ Tirar dúvidas\n\nComo posso te ajudar hoje?',
      paymentInstructions: '💳 *Formas de Pagamento Disponíveis:*\n\n🔹 PIX (Aprovação Instantânea)\n🔹 Cartão de Crédito\n🔹 Boleto Bancário\n\n📝 Após o pagamento, seus diamantes serão processados automaticamente!\n\n⏰ Horário de atendimento: Segunda a Sexta, 8h às 18h',
      businessHours: 'Segunda a Sexta: 8h às 18h\nSábado: 8h às 12h\nDomingo: Fechado',
    }
  });

  const onSubmit = async (data: ConfigForm) => {
    setIsConfiguring(true);

    // Simular configuração da IA
    setTimeout(() => {
      setIsConnected(true);
      setIsConfiguring(false);
    }, 3000);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    // Adicionar mensagem do usuário ao chat
    const userMessage = {
      type: 'user' as const,
      message: searchQuery,
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, userMessage]);

    try {
      const query = anaSearchService.parseQuery(searchQuery);
      const result = await anaSearchService.executeSearch(query, {
        vendas,
        revendedores,
        estoque: estoque.items
      });

      const naturalResponse = anaSearchService.generateNaturalResponse(result);

      // Adicionar resposta da Ana ao chat
      const anaMessage = {
        type: 'ana' as const,
        message: naturalResponse,
        result,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, anaMessage]);

      setSearchResult(result);
    } catch (error) {
      console.error('Erro na busca:', error);

      const errorMessage = {
        type: 'ana' as const,
        message: '😅 Desculpe, houve um erro ao processar sua solicitação. Pode tentar novamente com outras palavras?',
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsSearching(false);
      setSearchQuery('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const clearChat = () => {
    setChatHistory([{
      type: 'ana',
      message: '🤖 Chat limpo! Como posso te ajudar agora?',
      timestamp: new Date()
    }]);
    setSearchResult(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const renderSearchResult = (result: SearchResult) => {
    switch (result.type) {
      case 'vendas':
        return (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border">
            <h4 className="font-medium text-blue-900 mb-2">📊 {result.title}</h4>
            {result.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Revendedor</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.data.slice(0, 5).map((venda: any) => (
                    <TableRow key={venda.id}>
                      <TableCell>{formatDate(venda.date)}</TableCell>
                      <TableCell>{venda.revendedorName}</TableCell>
                      <TableCell>{formatCurrency(venda.totalValue)}</TableCell>
                      <TableCell>
                        <Badge variant={venda.status === 'pago' ? 'default' : 'secondary'}>
                          {venda.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-blue-700">Nenhuma venda encontrada.</p>
            )}
          </div>
        );

      case 'revendedores':
        return (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border">
            <h4 className="font-medium text-green-900 mb-2">👥 {result.title}</h4>
            {result.data.length > 0 ? (
              <div className="space-y-2">
                {result.data.map((revendedor: any) => (
                  <div key={revendedor.id} className="flex justify-between items-center p-2 bg-white rounded">
                    <div>
                      <span className="font-medium">{revendedor.name}</span>
                      {revendedor.performance && (
                        <div className="text-sm text-green-600">
                          {revendedor.performance.totalVendas} vendas • {formatCurrency(revendedor.performance.receita)}
                        </div>
                      )}
                    </div>
                    <Badge variant={revendedor.isActive ? 'default' : 'secondary'}>
                      {revendedor.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-green-700">Nenhum revendedor encontrado.</p>
            )}
          </div>
        );

      case 'estoque':
        return (
          <div className="mt-4 p-4 bg-purple-50 rounded-lg border">
            <h4 className="font-medium text-purple-900 mb-2">📦 {result.title}</h4>
            {result.data.length > 0 ? (
              <div className="space-y-2">
                {result.data.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center p-2 bg-white rounded">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <div className="text-sm text-purple-600">
                        {item.quantity} unidades • {formatCurrency(item.price)} cada
                      </div>
                    </div>
                    <Badge variant={item.quantity < 10 ? 'destructive' : 'default'}>
                      {item.quantity} em estoque
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-purple-700">Nenhum item encontrado.</p>
            )}
          </div>
        );

      case 'clientes':
        return (
          <div className="mt-4 p-4 bg-orange-50 rounded-lg border">
            <h4 className="font-medium text-orange-900 mb-2">🎯 {result.title}</h4>
            {result.data.length > 0 ? (
              <div className="space-y-2">
                {result.data.slice(0, 5).map((cliente: any, index: number) => (
                  <div key={cliente.id} className="flex justify-between items-center p-2 bg-white rounded">
                    <div>
                      <span className="font-medium">#{index + 1} {cliente.id}</span>
                      <div className="text-sm text-orange-600">
                        {cliente.totalCompras} compras • {cliente.diamantesTotal.toLocaleString()} diamantes
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(cliente.valorTotal)}</div>
                      <div className="text-xs text-orange-600">{formatDate(cliente.ultimaCompra)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-orange-700">Nenhum cliente encontrado.</p>
            )}
          </div>
        );

      case 'relatorio':
        return (
          <div className="mt-4 p-4 bg-indigo-50 rounded-lg border">
            <h4 className="font-medium text-indigo-900 mb-2">📈 {result.title}</h4>
            {result.data.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded">
                  <div className="text-lg font-bold">{result.data[0].vendas}</div>
                  <div className="text-sm text-indigo-600">Total de Vendas</div>
                </div>
                <div className="bg-white p-3 rounded">
                  <div className="text-lg font-bold">{formatCurrency(result.data[0].receita)}</div>
                  <div className="text-sm text-indigo-600">Receita Total</div>
                </div>
                <div className="bg-white p-3 rounded">
                  <div className="text-lg font-bold">{formatCurrency(result.data[0].lucro)}</div>
                  <div className="text-sm text-indigo-600">Lucro Total</div>
                </div>
                <div className="bg-white p-3 rounded">
                  <div className="text-lg font-bold">{result.data[0].margem.toFixed(1)}%</div>
                  <div className="text-sm text-indigo-600">Margem de Lucro</div>
                </div>
              </div>
            )}
          </div>
        );

      case 'ajuda':
        return (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-2">💡 {result.title}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {result.data.map((exemplo: any, index: number) => (
                <div
                  key={index}
                  className="p-2 bg-white rounded border cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setSearchQuery(exemplo.exemplo)}
                >
                  <code className="text-sm text-gray-700">{exemplo.exemplo}</code>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const features = [
    {
      icon: MessageCircle,
      title: 'Respostas Automáticas',
      description: 'Responde automaticamente perguntas frequentes sobre diamantes e pedidos'
    },
    {
      icon: Zap,
      title: 'Processamento Instantâneo',
      description: 'Processa pedidos de diamantes Kwai em tempo real'
    },
    {
      icon: Phone,
      title: 'Atendimento 24/7',
      description: 'Atendimento básico disponível 24 horas por dia'
    },
    {
      icon: CheckCircle,
      title: 'Confirmação de Pagamentos',
      description: 'Confirma pagamentos PIX automaticamente via webhook'
    }
  ];

  const stats = [
    { label: 'Mensagens Processadas', value: '1,247', change: '+12%' },
    { label: 'Taxa de Resolução', value: '94%', change: '+5%' },
    { label: 'Tempo Resposta Médio', value: '2.3s', change: '-0.4s' },
    { label: 'Clientes Atendidos', value: '428', change: '+18%' },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Bot className="h-8 w-8 text-blue-600" />
            IA Ana - WhatsApp
          </h1>
          <p className="text-slate-600 mt-1">
            Configure sua assistente virtual para WhatsApp
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-slate-400'}`} />
            {isConnected ? 'Conectada' : 'Desconectada'}
          </Badge>

          {isConnected && (
            <Button variant="outline" onClick={handleDisconnect}>
              Desconectar
            </Button>
          )}
        </div>
      </motion.div>

      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-4 md:grid-cols-4"
        >
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-slate-600">{stat.label}</p>
                <div className="text-xs text-green-600 mt-1">{stat.change}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuração da IA Ana
              </CardTitle>
              <CardDescription>
                Configure os parâmetros da assistente virtual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">Número do WhatsApp Business</Label>
                  <Input
                    id="whatsappNumber"
                    placeholder="(11) 99999-9999"
                    {...register('whatsappNumber')}
                    className={errors.whatsappNumber ? 'border-red-500' : ''}
                    disabled={isConnected}
                  />
                  {errors.whatsappNumber && (
                    <p className="text-sm text-red-500">{errors.whatsappNumber.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessName">Nome do Negócio</Label>
                  <Input
                    id="businessName"
                    placeholder="Agência Check"
                    {...register('businessName')}
                    className={errors.businessName ? 'border-red-500' : ''}
                    disabled={isConnected}
                  />
                  {errors.businessName && (
                    <p className="text-sm text-red-500">{errors.businessName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="welcomeMessage">Mensagem de Boas-vindas</Label>
                  <textarea
                    id="welcomeMessage"
                    rows={6}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md resize-none"
                    placeholder="Mensagem que será enviada quando um cliente entrar em contato"
                    {...register('welcomeMessage')}
                    disabled={isConnected}
                  />
                  {errors.welcomeMessage && (
                    <p className="text-sm text-red-500">{errors.welcomeMessage.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentInstructions">Instruções de Pagamento</Label>
                  <textarea
                    id="paymentInstructions"
                    rows={4}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md resize-none"
                    placeholder="Instruções sobre formas de pagamento"
                    {...register('paymentInstructions')}
                    disabled={isConnected}
                  />
                  {errors.paymentInstructions && (
                    <p className="text-sm text-red-500">{errors.paymentInstructions.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessHours">Horário de Funcionamento</Label>
                  <textarea
                    id="businessHours"
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md resize-none"
                    placeholder="Horários de atendimento"
                    {...register('businessHours')}
                    disabled={isConnected}
                  />
                  {errors.businessHours && (
                    <p className="text-sm text-red-500">{errors.businessHours.message}</p>
                  )}
                </div>

                {!isConnected && (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isConfiguring}
                  >
                    {isConfiguring ? 'Configurando...' : 'Conectar IA Ana'}
                  </Button>
                )}
              </form>

              {isConfiguring && (
                <Alert className="mt-4">
                  <Bot className="h-4 w-4" />
                  <AlertDescription>
                    Configurando IA Ana... Aguarde enquanto estabelecemos a conexão com o WhatsApp.
                  </AlertDescription>
                </Alert>
              )}

              {isConnected && (
                <Alert className="mt-4 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    IA Ana está conectada e funcionando! Seus clientes já podem conversar com ela no WhatsApp.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades da IA Ana</CardTitle>
              <CardDescription>
                O que sua assistente virtual pode fazer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {features.map((feature) => (
                  <div key={feature.title} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <feature.icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{feature.title}</h4>
                      <p className="text-sm text-slate-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview da Mensagem</CardTitle>
              <CardDescription>
                Como os clientes verão a mensagem de boas-vindas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium text-green-800">Ana - Agência Check</span>
                </div>
                <div className="text-sm text-green-700 whitespace-pre-line">
                  {watch('welcomeMessage')}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
