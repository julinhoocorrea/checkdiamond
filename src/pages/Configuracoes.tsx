import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Settings, TestTube, Shield, Database, Globe, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PixService } from '@/services/pixService';

interface ConfigForm {
  // Banco Inter Configs
  interClientId: string;
  interClientSecret: string;
  interCertificatePath: string;
  interBaseUrl: string;
  interSandboxUrl: string;
  interEnvironment: 'sandbox' | 'production';
  interPixKey: string;
  interTimeout: number;
  interMaxRetries: number;
  interWebhookUrl: string;
  interWebhookSecret: string;

  // 4send Configs
  foursendApiToken: string;
  foursendBaseUrl: string;
  foursendEnvironment: 'sandbox' | 'production';
  foursendCallbackUrl: string;
  foursendTimeout: number;
  foursendMaxRetries: number;
  foursendCustomHeaders: string;

  // Global Advanced Configs
  globalCallbackUrl: string;
  globalTimeout: number;
  maxRetryDelay: number;
  webhookValidationSecret: string;
  logRetentionDays: number;

  // Boolean configs
  enableAutoRetry: boolean;
  enableSecurityValidation: boolean;
  enableDetailedLogs: boolean;
  enableApiMonitoring: boolean;
  enableWebhookSignatureValidation: boolean;
  enableTransactionLogs: boolean;
  interEnableSSLValidation: boolean;
  interEnableWebhookValidation: boolean;
  foursendEnableNotifications: boolean;
  foursendEnableCustomHeaders: boolean;
}

export function Configuracoes() {
  const [activeTab, setActiveTab] = useState<'inter' | '4send' | 'advanced'>('inter');
  const [isTestingConnectivity, setIsTestingConnectivity] = useState(false);
  const [connectivityResults, setConnectivityResults] = useState<{
    inter?: { success: boolean; message: string };
    foursend?: { success: boolean; message: string };
  }>({});

  const { register, handleSubmit, watch, setValue, reset, getValues, formState: { errors } } = useForm<ConfigForm>({
    defaultValues: {
      interEnvironment: 'production',
      foursendEnvironment: 'production',
      globalTimeout: 30,
      maxRetryDelay: 60,
      logRetentionDays: 30,
      interTimeout: 30,
      interMaxRetries: 3,
      foursendTimeout: 30,
      foursendMaxRetries: 3,
      enableAutoRetry: true,
      enableSecurityValidation: true,
      enableDetailedLogs: false,
      enableApiMonitoring: true,
      enableWebhookSignatureValidation: true,
      enableTransactionLogs: true,
      interEnableSSLValidation: true,
      interEnableWebhookValidation: true,
      foursendEnableNotifications: true,
      foursendEnableCustomHeaders: false,
    }
  });

  // Carregar configurações salvas do localStorage
  useEffect(() => {
    const loadSavedConfigurations = () => {
      try {
        console.log('🔍 Verificando localStorage para pixConfigurations...');
        const savedConfigs = localStorage.getItem('pixConfigurations');
        console.log('📦 Dados encontrados no localStorage:', savedConfigs);

        if (savedConfigs) {
          const parsedConfigs = JSON.parse(savedConfigs) as ConfigForm;
          console.log('📥 Configurações parseadas:', parsedConfigs);

          // Atualizar o formulário com os valores salvos
          reset(parsedConfigs);
          console.log('✅ Formulário atualizado com dados salvos');

          toast.success('✅ Configurações carregadas!', {
            description: 'Suas configurações PIX foram restauradas.'
          });
        } else {
          console.log('ℹ️ Nenhuma configuração salva encontrada');
        }
      } catch (error) {
        console.error('❌ Erro ao carregar configurações:', error);
        toast.error('❌ Erro ao carregar configurações salvas', {
          description: 'Usando valores padrão.'
        });
      }
    };

    // Delay para garantir que o componente está completamente montado
    setTimeout(loadSavedConfigurations, 100);
  }, [reset]);

  const onSubmit = (data: ConfigForm) => {
    console.log('💾 Salvando configurações:', data);

    try {
      // Salvar configurações no localStorage
      const dataToSave = JSON.stringify(data);
      console.log('📤 Dados sendo salvos:', dataToSave);

      localStorage.setItem('pixConfigurations', dataToSave);

      // Verificar se foi salvo corretamente
      const saved = localStorage.getItem('pixConfigurations');
      console.log('✅ Verificação pós-salvamento:', saved);

      if (saved) {
        toast.success('✅ Configurações salvas com sucesso!', {
          description: 'Todas as configurações PIX foram atualizadas.'
        });
      } else {
        throw new Error('Dados não foram salvos no localStorage');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error);
      toast.error('❌ Erro ao salvar configurações', {
        description: 'Tente novamente.'
      });
    }
  };

  const testConnectivity = async (provider: 'inter' | '4send' | 'both') => {
    setIsTestingConnectivity(true);

    try {
      if (provider === 'inter' || provider === 'both') {
        const result = await PixService.testConnectivity('inter');
        setConnectivityResults(prev => ({ ...prev, inter: result }));
      }

      if (provider === '4send' || provider === 'both') {
        const result = await PixService.testConnectivity('4send');
        setConnectivityResults(prev => ({ ...prev, foursend: result }));
      }

      toast.success('🔍 Teste de conectividade concluído!');
    } catch (error) {
      toast.error('❌ Erro no teste de conectividade');
    } finally {
      setIsTestingConnectivity(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-800">⚙️ Configurações PIX</h1>
          <p className="text-slate-600 mt-2">
            Configure os provedores de pagamento PIX e configurações avançadas
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const currentValues = getValues();
              console.log('🔍 Valores atuais do formulário:', currentValues);
              const savedData = localStorage.getItem('pixConfigurations');
              console.log('💾 Dados salvos no localStorage:', savedData);
              toast.info('🔍 Debug executado', {
                description: 'Verifique o console para detalhes.'
              });
            }}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Debug
          </Button>
          <Button
            variant="outline"
            onClick={() => testConnectivity('both')}
            disabled={isTestingConnectivity}
            className="flex items-center gap-2"
          >
            <TestTube className="h-4 w-4" />
            {isTestingConnectivity ? 'Testando...' : 'Testar Conectividade'}
          </Button>
        </div>
      </motion.div>

      {/* Tabs de Navegação */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex space-x-1 bg-gray-100 p-1 rounded-lg"
      >
        {[
          { key: 'inter', label: '🏦 Banco Inter', icon: Globe },
          { key: '4send', label: '📱 4send', icon: Settings },
          { key: 'advanced', label: '🔧 Avançadas', icon: Shield }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'inter' | '4send' | 'advanced')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
              activeTab === tab.key
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Configurações Banco Inter */}
        {activeTab === 'inter' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🏦 Configurações Banco Inter
                  {connectivityResults.inter && (
                    <Badge variant={connectivityResults.inter.success ? "default" : "destructive"}>
                      {connectivityResults.inter.success ? 'Online' : 'Offline'}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Configure as credenciais e configurações avançadas do Banco Inter
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Ambiente */}
                <div className="space-y-2">
                  <Label htmlFor="interEnvironment">Ambiente</Label>
                  <Select onValueChange={(value) => setValue('interEnvironment', value as 'sandbox' | 'production')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ambiente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">🧪 Sandbox (Testes)</SelectItem>
                      <SelectItem value="production">🚀 Produção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Credenciais Básicas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interClientId">Client ID</Label>
                    <Input
                      id="interClientId"
                      placeholder="27dc6392-c910-4cf8-a813-6d9ee3c53d2c"
                      {...register('interClientId', { required: 'Client ID é obrigatório' })}
                    />
                    {errors.interClientId && (
                      <p className="text-red-500 text-xs">{errors.interClientId.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interClientSecret">Client Secret</Label>
                    <Input
                      id="interClientSecret"
                      type="password"
                      placeholder="b27ef11f-89e6-4010-961b-2311afab2a75"
                      {...register('interClientSecret', { required: 'Client Secret é obrigatório' })}
                    />
                    {errors.interClientSecret && (
                      <p className="text-red-500 text-xs">{errors.interClientSecret.message}</p>
                    )}
                  </div>
                </div>

                {/* URLs de Ambiente */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interBaseUrl">URL Base Produção</Label>
                    <Input
                      id="interBaseUrl"
                      placeholder="https://cdpj.partners.bancointer.com.br"
                      {...register('interBaseUrl')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interSandboxUrl">URL Base Sandbox</Label>
                    <Input
                      id="interSandboxUrl"
                      placeholder="https://cdpj-sandbox.partners.bancointer.com.br"
                      {...register('interSandboxUrl')}
                    />
                  </div>
                </div>

                {/* PIX Key e Certificado */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interPixKey">Chave PIX</Label>
                    <Input
                      id="interPixKey"
                      placeholder="58975369000108"
                      {...register('interPixKey')}
                    />
                    <p className="text-xs text-gray-500">
                      CNPJ, email, telefone ou chave aleatória
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interCertificatePath">Caminho do Certificado SSL</Label>
                    <Input
                      id="interCertificatePath"
                      placeholder="/path/to/certificate.p12"
                      {...register('interCertificatePath')}
                    />
                    <p className="text-xs text-gray-500">
                      Arquivo .p12 para autenticação SSL
                    </p>
                  </div>
                </div>

                {/* Configurações de Timeout e Retry */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interTimeout">Timeout (segundos)</Label>
                    <Input
                      id="interTimeout"
                      type="number"
                      min="5"
                      max="120"
                      {...register('interTimeout')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interMaxRetries">Máximo de Tentativas</Label>
                    <Input
                      id="interMaxRetries"
                      type="number"
                      min="1"
                      max="10"
                      {...register('interMaxRetries')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teste de Conectividade</Label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => testConnectivity('inter')}
                      disabled={isTestingConnectivity}
                      className="w-full"
                    >
                      {isTestingConnectivity ? 'Testando...' : 'Testar Inter'}
                    </Button>
                  </div>
                </div>

                {/* Webhook Configurations */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interWebhookUrl">URL do Webhook</Label>
                    <Input
                      id="interWebhookUrl"
                      placeholder="https://seudominio.com/webhook/inter"
                      {...register('interWebhookUrl')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="interWebhookSecret">Webhook Secret</Label>
                    <Input
                      id="interWebhookSecret"
                      type="password"
                      placeholder="secret_webhook_inter"
                      {...register('interWebhookSecret')}
                    />
                  </div>
                </div>

                {/* Configurações Avançadas Inter */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Configurações Avançadas</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="interEnableSSLValidation"
                        {...register('interEnableSSLValidation')}
                      />
                      <Label htmlFor="interEnableSSLValidation" className="text-sm">
                        Validação SSL Rigorosa
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="interEnableWebhookValidation"
                        {...register('interEnableWebhookValidation')}
                      />
                      <Label htmlFor="interEnableWebhookValidation" className="text-sm">
                        Validação de Webhook
                      </Label>
                    </div>
                  </div>
                </div>

                {connectivityResults.inter && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Status de Conectividade:</strong> {connectivityResults.inter.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Configurações 4send */}
        {activeTab === '4send' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📱 Configurações 4send
                  {connectivityResults.foursend && (
                    <Badge variant={connectivityResults.foursend.success ? "default" : "destructive"}>
                      {connectivityResults.foursend.success ? 'Online' : 'Offline'}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Configure as credenciais e configurações avançadas do 4send
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Ambiente 4send */}
                <div className="space-y-2">
                  <Label htmlFor="foursendEnvironment">Ambiente</Label>
                  <Select onValueChange={(value) => setValue('foursendEnvironment', value as 'sandbox' | 'production')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ambiente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sandbox">🧪 Sandbox (Testes)</SelectItem>
                      <SelectItem value="production">🚀 Produção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Credenciais 4send */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="foursendApiToken">API Token</Label>
                    <Input
                      id="foursendApiToken"
                      type="password"
                      placeholder="sua_api_token_4send"
                      {...register('foursendApiToken', { required: 'API Token é obrigatório' })}
                    />
                    {errors.foursendApiToken && (
                      <p className="text-red-500 text-xs">{errors.foursendApiToken.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="foursendBaseUrl">URL Base API</Label>
                    <Input
                      id="foursendBaseUrl"
                      placeholder="https://api.best4send.com"
                      {...register('foursendBaseUrl')}
                    />
                  </div>
                </div>

                {/* Callback e Timeout */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="foursendCallbackUrl">URL de Callback</Label>
                    <Input
                      id="foursendCallbackUrl"
                      placeholder="https://seudominio.com/callback/4send"
                      {...register('foursendCallbackUrl')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="foursendTimeout">Timeout (segundos)</Label>
                    <Input
                      id="foursendTimeout"
                      type="number"
                      min="5"
                      max="120"
                      {...register('foursendTimeout')}
                    />
                  </div>
                </div>

                {/* Headers Customizados */}
                <div className="space-y-2">
                  <Label htmlFor="foursendCustomHeaders">Headers Personalizados (JSON)</Label>
                  <Input
                    id="foursendCustomHeaders"
                    placeholder='{"X-Custom-Header": "valor", "X-Another-Header": "outro-valor"}'
                    {...register('foursendCustomHeaders')}
                  />
                  <p className="text-xs text-gray-500">
                    Headers adicionais em formato JSON para as requisições
                  </p>
                </div>

                {/* Configurações 4send */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="foursendMaxRetries">Máximo de Tentativas</Label>
                    <Input
                      id="foursendMaxRetries"
                      type="number"
                      min="1"
                      max="10"
                      {...register('foursendMaxRetries')}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      id="foursendEnableNotifications"
                      {...register('foursendEnableNotifications')}
                    />
                    <Label htmlFor="foursendEnableNotifications" className="text-sm">
                      Notificações Ativas
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox
                      id="foursendEnableCustomHeaders"
                      {...register('foursendEnableCustomHeaders')}
                    />
                    <Label htmlFor="foursendEnableCustomHeaders" className="text-sm">
                      Headers Customizados
                    </Label>
                  </div>
                </div>

                {/* Teste de Conectividade 4send */}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => testConnectivity('4send')}
                    disabled={isTestingConnectivity}
                  >
                    {isTestingConnectivity ? 'Testando...' : 'Testar 4send'}
                  </Button>
                </div>

                {connectivityResults.foursend && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Status de Conectividade:</strong> {connectivityResults.foursend.message}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Configurações Avançadas Gerais */}
        {activeTab === 'advanced' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⚙️ Configurações Avançadas
                </CardTitle>
                <CardDescription>
                  Configurações gerais de segurança, monitoramento e logs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="globalCallbackUrl">URL de Callback Global</Label>
                  <Input
                    id="globalCallbackUrl"
                    placeholder="https://seudominio.com/callback/global"
                    {...register('globalCallbackUrl')}
                  />
                  <p className="text-xs text-gray-500">
                    URL global para receber notificações de todos os provedores
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="globalTimeout">Timeout Global (segundos)</Label>
                    <Input
                      id="globalTimeout"
                      type="number"
                      min="5"
                      max="120"
                      placeholder="30"
                      {...register('globalTimeout')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxRetryDelay">Delay Máximo entre Tentativas</Label>
                    <Input
                      id="maxRetryDelay"
                      type="number"
                      min="1"
                      max="300"
                      placeholder="60"
                      {...register('maxRetryDelay')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhookValidationSecret">Webhook Validation Secret</Label>
                  <Input
                    id="webhookValidationSecret"
                    type="password"
                    placeholder="secret_para_validacao_webhook"
                    {...register('webhookValidationSecret')}
                  />
                  <p className="text-xs text-gray-500">
                    Chave secreta para validar a autenticidade dos webhooks
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logRetentionDays">Retenção de Logs (dias)</Label>
                  <Input
                    id="logRetentionDays"
                    type="number"
                    min="1"
                    max="365"
                    placeholder="30"
                    {...register('logRetentionDays')}
                  />
                  <p className="text-xs text-gray-500">
                    Número de dias para manter os logs armazenados
                  </p>
                </div>

                {/* Configurações de Checkbox */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableAutoRetry"
                      {...register('enableAutoRetry')}
                    />
                    <Label htmlFor="enableAutoRetry" className="text-sm">
                      Habilitar Retry Automático
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableSecurityValidation"
                      {...register('enableSecurityValidation')}
                    />
                    <Label htmlFor="enableSecurityValidation" className="text-sm">
                      Validação de Segurança
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableDetailedLogs"
                      {...register('enableDetailedLogs')}
                    />
                    <Label htmlFor="enableDetailedLogs" className="text-sm">
                      Logs Detalhados
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableApiMonitoring"
                      {...register('enableApiMonitoring')}
                    />
                    <Label htmlFor="enableApiMonitoring" className="text-sm">
                      Monitoramento de API
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableWebhookSignatureValidation"
                      {...register('enableWebhookSignatureValidation')}
                    />
                    <Label htmlFor="enableWebhookSignatureValidation" className="text-sm">
                      Validação de Assinatura Webhook
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enableTransactionLogs"
                      {...register('enableTransactionLogs')}
                    />
                    <Label htmlFor="enableTransactionLogs" className="text-sm">
                      Logs de Transações
                    </Label>
                  </div>
                </div>

                <Alert>
                  <AlertDescription>
                    <strong>Configurações Avançadas:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Logs detalhados podem impactar performance em alto volume</li>
                      <li>Validação de segurança adiciona proteção contra ataques</li>
                      <li>Monitoramento de API permite análise em tempo real</li>
                      <li>Configurações de retry são importantes para estabilidade</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Botões de Ação */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-end gap-4"
        >
          <Button type="button" variant="outline">
            ⚠️ Restaurar Padrões
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            💾 Salvar Configurações
          </Button>
        </motion.div>
      </form>
    </div>
  );
}
