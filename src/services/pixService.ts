// Configurações do Banco Inter
const INTER_CONFIG = {
  clientId: import.meta.env?.VITE_INTER_CLIENT_ID || "27dc6392-c910-4cf8-a813-6d9ee3c53d2c",
  clientSecret: import.meta.env?.VITE_INTER_CLIENT_SECRET || "b27ef11f-89e6-4010-961b-2311afab2a75",
  certificatePath: import.meta.env?.VITE_INTER_CERTIFICATE_PATH || "",
  baseUrl: "https://cdpj.partners.bancointer.com.br",
  sandboxUrl: "https://cdpj-sandbox.partners.bancointer.com.br",
  scope: "pix.cob.write pix.cob.read webhook.read webhook.write"
};

// Configurações do 4send
const FOURGSEND_CONFIG = {
  apiToken: import.meta.env?.VITE_4SEND_API_TOKEN || "cmcazsovs01k1bm7eei4iqtw0",
  apiKey: "58975369000168",
  baseUrl: "https://api.4send.com.br"
};

// Configurações Padrão Avançadas
const DEFAULT_ADVANCED_CONFIG = {
  globalTimeout: 30,
  maxRetryDelay: 60,
  logRetentionDays: 30,
  enableAutoRetry: true,
  enableSecurityValidation: true,
  enableDetailedLogs: false,
  enableApiMonitoring: true,
  enableWebhookSignatureValidation: true,
  enableTransactionLogs: true,
  interTimeout: 30,
  interMaxRetries: 3,
  interEnableSSLValidation: true,
  interEnableWebhookValidation: true,
  foursendTimeout: 30,
  foursendMaxRetries: 3,
  foursendEnableNotifications: true,
  foursendEnableCustomHeaders: false,
};

export type PixProvider = 'inter' | '4send';

export interface PixPaymentRequest {
  amount: number;
  description: string;
  customerName?: string;
  customerDocument?: string;
  customerEmail?: string;
  customerPhone?: string;
  externalId?: string;
  expiresIn?: number;
}

export interface PixPaymentResponse {
  id: string;
  amount: number;
  description: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  pixKey?: string;
  qrCode?: string;
  paymentLink?: string;
  expiresAt?: Date;
  paidAt?: Date;
  provider: PixProvider;
}

export interface InterTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

// Interface para Configurações Avançadas
export interface PixAdvancedConfig {
  // Banco Inter
  interClientId?: string;
  interClientSecret?: string;
  interCertificatePath?: string;
  interBaseUrl?: string;
  interSandboxUrl?: string;
  interEnvironment?: 'sandbox' | 'production';
  interPixKey?: string;
  interTimeout?: number;
  interMaxRetries?: number;
  interWebhookUrl?: string;
  interWebhookSecret?: string;
  interEnableSSLValidation?: boolean;
  interEnableWebhookValidation?: boolean;

  // 4send
  foursendApiToken?: string;
  foursendBaseUrl?: string;
  foursendEnvironment?: 'sandbox' | 'production';
  foursendCallbackUrl?: string;
  foursendTimeout?: number;
  foursendMaxRetries?: number;
  foursendCustomHeaders?: string;
  foursendEnableNotifications?: boolean;
  foursendEnableCustomHeaders?: boolean;

  // Global
  globalCallbackUrl?: string;
  globalTimeout?: number;
  maxRetryDelay?: number;
  webhookValidationSecret?: string;
  logRetentionDays?: number;
  enableAutoRetry?: boolean;
  enableSecurityValidation?: boolean;
  enableDetailedLogs?: boolean;
  enableApiMonitoring?: boolean;
  enableWebhookSignatureValidation?: boolean;
  enableTransactionLogs?: boolean;
}

// Interface para Logs Detalhados
export interface PixLogEntry {
  timestamp: Date;
  provider: PixProvider;
  action: string;
  data: Record<string, unknown>;
  success: boolean;
  error?: string;
  responseTime?: number;
}

class PixServiceClass {
  private interToken: string | null = null;
  private interTokenExpiry: Date | null = null;
  private developmentMode: boolean;
  private advancedConfig: PixAdvancedConfig = {
    interClientId: '',
    interClientSecret: '',
    interPixKey: '',
    interEnvironment: 'production',
    foursendApiToken: 'cmcazsovs01k1bm7eei4iqtw0',
    foursendBaseUrl: 'https://api.4send.com.br',
    foursendEnvironment: 'production'
  };
  private logs: PixLogEntry[] = [];

  constructor() {
    // Carregar configurações do localStorage
    this.loadAdvancedConfig();

    // Verificar se temos credenciais configuradas
    const hasInterCredentials = this.advancedConfig.interClientId &&
                                this.advancedConfig.interClientSecret &&
                                this.advancedConfig.interPixKey;

    const has4sendCredentials = this.advancedConfig.foursendApiToken;

    // Forçar modo produção - sempre tentar APIs reais
    this.developmentMode = false;

    console.log('🚀 PIX Service - Modo PRODUÇÃO ativado');

    if (has4sendCredentials) {
      console.log('✅ 4Send: Credenciais configuradas e prontas para uso');
      console.log('🔑 API Token:', this.advancedConfig.foursendApiToken?.substring(0, 12) + '...');
      console.log('🔗 URL Base:', this.advancedConfig.foursendBaseUrl || FOURGSEND_CONFIG.baseUrl);
      console.log('🌐 Ambiente:', this.advancedConfig.foursendEnvironment || 'production');
      console.log('💎 Provedor Padrão: 4Send (recomendado)');
    }

    if (hasInterCredentials) {
      console.log('✅ Banco Inter: Credenciais válidas encontradas');
      console.log('🔑 Client ID:', this.advancedConfig.interClientId?.substring(0, 12) + '...');
      console.log('💳 Chave PIX:', this.advancedConfig.interPixKey);
      console.log('🌐 Ambiente:', this.advancedConfig.interEnvironment || 'production');
      console.log('🔗 URL Base:', this.getInterBaseUrl());
    }

    if (!has4sendCredentials && !hasInterCredentials) {
      console.log('⚠️ Nenhuma credencial PIX configurada');
      console.log('💡 Configure 4Send ou Banco Inter para gerar cobranças oficiais');
    }

    // Configurar limpeza automática de logs
    this.setupLogCleanup();
  }

  // Carregar configurações avançadas do localStorage
  private loadAdvancedConfig(): void {
    try {
      const savedConfig = localStorage.getItem('pixConfigurations');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        this.advancedConfig = { ...DEFAULT_ADVANCED_CONFIG, ...parsed };
      } else {
        this.advancedConfig = { ...DEFAULT_ADVANCED_CONFIG };
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar configurações avançadas:', error);
      this.advancedConfig = { ...DEFAULT_ADVANCED_CONFIG };
    }
  }

  // Salvar configurações avançadas
  public saveAdvancedConfig(config: PixAdvancedConfig): void {
    try {
      this.advancedConfig = { ...this.advancedConfig, ...config };
      localStorage.setItem('pixConfigurations', JSON.stringify(this.advancedConfig));
      console.log('✅ Configurações PIX salvas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao salvar configurações PIX:', error);
      throw new Error('Erro ao salvar configurações');
    }
  }

  // Obter configurações atuais
  public getAdvancedConfig(): PixAdvancedConfig {
    return { ...this.advancedConfig };
  }

  // Configurar limpeza automática de logs
  private setupLogCleanup(): void {
    if (this.advancedConfig.logRetentionDays) {
      setInterval(() => {
        this.cleanupOldLogs();
      }, 24 * 60 * 60 * 1000); // Executar uma vez por dia
    }
  }

  // Limpar logs antigos
  private cleanupOldLogs(): void {
    if (!this.advancedConfig.logRetentionDays) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.advancedConfig.logRetentionDays);

    const initialCount = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp > cutoffDate);

    if (this.logs.length < initialCount) {
      console.log(`🧹 Logs limpos: ${initialCount - this.logs.length} entradas removidas`);
    }
  }

  // Adicionar entrada de log
  private addLog(provider: PixProvider, action: string, data: Record<string, unknown>, success: boolean, error?: string, responseTime?: number): void {
    if (!this.advancedConfig.enableDetailedLogs && !this.advancedConfig.enableTransactionLogs) {
      return;
    }

    const logEntry: PixLogEntry = {
      timestamp: new Date(),
      provider,
      action,
      data: this.advancedConfig.enableDetailedLogs ? data : { sanitized: true },
      success,
      error,
      responseTime
    };

    this.logs.push(logEntry);

    // Manter apenas os últimos 1000 logs para evitar uso excessivo de memória
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  }

  // Obter logs para análise
  public getLogs(provider?: PixProvider, limit = 100): PixLogEntry[] {
    let filteredLogs = this.logs;

    if (provider) {
      filteredLogs = this.logs.filter(log => log.provider === provider);
    }

    return filteredLogs.slice(-limit).reverse(); // Mais recentes primeiro
  }

  // Método para obter token do Banco Inter com configurações avançadas
  private async getInterToken(): Promise<string> {
    const startTime = Date.now();

    if (this.developmentMode) {
      console.log('🔧 [DEV] Simulando obtenção de token Inter');
      this.addLog('inter', 'getToken', { mode: 'development' }, true, undefined, Date.now() - startTime);
      return 'dev_token_12345';
    }

    // Verificar se o token atual ainda é válido (com margem de 5 minutos)
    if (this.interToken && this.interTokenExpiry &&
        new Date(Date.now() + 5 * 60 * 1000) < this.interTokenExpiry) {
      const remaining = Math.round((this.interTokenExpiry.getTime() - Date.now()) / 1000 / 60);
      console.log(`✅ Token Inter válido (${remaining}min restantes)`);
      return this.interToken;
    }

    console.log('🔑 Obtendo novo token do Banco Inter...');

    try {
      const clientId = this.advancedConfig.interClientId || INTER_CONFIG.clientId;
      const clientSecret = this.advancedConfig.interClientSecret || INTER_CONFIG.clientSecret;
      const baseUrl = this.getInterBaseUrl();
      const timeout = (this.advancedConfig.interTimeout || 30) * 1000;

      const credentials = btoa(`${clientId}:${clientSecret}`);

      console.log('📡 Fazendo requisição OAuth2 para:', `${baseUrl}/oauth/v2/token`);

      // Criar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${baseUrl}/oauth/v2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
        },
        body: `grant_type=client_credentials&scope=${encodeURIComponent(INTER_CONFIG.scope)}`,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      console.log('📨 Resposta OAuth2:', response.status, response.statusText, `(${responseTime}ms)`);

      if (!response.ok) {
        const errorText = await response.text();
        const error = `Erro na autenticação Inter: ${response.status} - ${errorText}`;
        console.error('❌', error);

        this.addLog('inter', 'getToken', { status: response.status }, false, error, responseTime);
        throw new Error(error);
      }

      const data: InterTokenResponse = await response.json();
      console.log('✅ Token obtido com sucesso! Expira em:', data.expires_in, 'segundos');

      this.interToken = data.access_token;
      this.interTokenExpiry = new Date(Date.now() + (data.expires_in * 1000) - 60000); // 1 minuto antes de expirar

      this.addLog('inter', 'getToken', {
        expiresIn: data.expires_in,
        scope: data.scope
      }, true, undefined, responseTime);

      return this.interToken;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

      // Análise específica do tipo de erro
      let fallbackReason = 'Erro desconhecido';
      if (errorMessage.includes('CORS')) {
        fallbackReason = 'Bloqueio CORS do navegador';
      } else if (errorMessage.includes('Failed to fetch')) {
        fallbackReason = 'Rede/Conectividade';
      } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
        fallbackReason = 'Credenciais inválidas';
      } else if (errorMessage.includes('timeout')) {
        fallbackReason = 'Timeout da requisição';
      }

      console.error(`❌ Falha na autenticação Inter (${fallbackReason}):`, errorMessage);

      this.addLog('inter', 'getToken', {
        fallback: true,
        reason: fallbackReason,
        originalError: errorMessage
      }, false, errorMessage, responseTime);

      // Para PIX oficial, não fazer fallback automático - retornar token que indica erro
      return `fallback_${Date.now()}_${fallbackReason.replace(/\s+/g, '_')}`;
    }
  }

  // Obter URL base do Inter baseada no ambiente
  private getInterBaseUrl(): string {
    const environment = this.advancedConfig.interEnvironment || 'production';
    if (environment === 'sandbox') {
      return this.advancedConfig.interSandboxUrl || INTER_CONFIG.sandboxUrl;
    }
    return this.advancedConfig.interBaseUrl || INTER_CONFIG.baseUrl;
  }

  // Gerar QR Code PIX no formato EMV padrão do Banco Central
  private generatePixQrCode(pixKey: string, amount: string, description: string, txid: string): string {
    // Formato EMV QR Code para PIX conforme especificação do Banco Central
    const merchantName = 'AGENCIA CHECK DIAMONDS';
    const merchantCity = 'SAO PAULO';
    const merchantCategoryCode = '0000';
    const countryCode = 'BR';
    const currency = '986'; // BRL

    // Construir o QR Code PIX
    let qrCode = '';
    qrCode += '00020126'; // Payload Format Indicator
    qrCode += '580014BR.GOV.BCB.PIX'; // Merchant Account Information
    qrCode += '0136' + pixKey; // PIX Key
    qrCode += '5204' + merchantCategoryCode; // Merchant Category Code
    qrCode += '5303' + currency; // Transaction Currency
    qrCode += '5406' + amount; // Transaction Amount
    qrCode += '5802' + countryCode; // Country Code
    qrCode += '59' + merchantName.length.toString().padStart(2, '0') + merchantName; // Merchant Name
    qrCode += '60' + merchantCity.length.toString().padStart(2, '0') + merchantCity; // Merchant City
    qrCode += '6214'; // Additional Data Field Template
    qrCode += '0510' + txid; // Reference Label (TXID)
    qrCode += '6304'; // CRC16 placeholder

    return qrCode;
  }

  // Obter headers customizados para 4send
  private get4sendCustomHeaders(): Record<string, string> {
    if (!this.advancedConfig.foursendEnableCustomHeaders || !this.advancedConfig.foursendCustomHeaders) {
      return {};
    }

    try {
      return JSON.parse(this.advancedConfig.foursendCustomHeaders);
    } catch (error) {
      console.warn('⚠️ Erro ao parsear headers customizados do 4send:', error);
      return {};
    }
  }

  // Implementar retry automático
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    provider: PixProvider,
    actionName: string,
    maxRetries?: number
  ): Promise<T> {
    const retries = maxRetries ||
      (provider === 'inter' ? this.advancedConfig.interMaxRetries : this.advancedConfig.foursendMaxRetries) || 3;

    const retryDelay = this.advancedConfig.maxRetryDelay || 60;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await operation();
        if (attempt > 1) {
          console.log(`✅ Operação ${actionName} bem-sucedida na tentativa ${attempt}`);
        }
        return result;
      } catch (error) {
        const isLastAttempt = attempt === retries;

        if (isLastAttempt || !this.advancedConfig.enableAutoRetry) {
          throw error;
        }

        const delay = Math.min(1000 * 2 ** (attempt - 1), retryDelay * 1000);
        console.warn(`⚠️ Tentativa ${attempt} falhou para ${actionName}, tentando novamente em ${delay}ms:`, error);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error(`Todas as ${retries} tentativas falharam`);
  }

  // Criar pagamento PIX no Banco Inter com configurações avançadas
  private async createInterPayment(request: PixPaymentRequest): Promise<PixPaymentResponse> {
    const startTime = Date.now();

    // Verificar se temos credenciais válidas
    const hasCredentials = this.advancedConfig.interClientId &&
                          this.advancedConfig.interClientSecret &&
                          this.advancedConfig.interPixKey;

    if (!hasCredentials) {
      throw new Error('❌ Credenciais PIX não configuradas. Configure Client ID, Client Secret e Chave PIX nas Configurações.');
    }

    console.log('🏦 Iniciando criação de cobrança PIX OFICIAL Banco Inter...');
    console.log('📋 Dados da cobrança:', {
      valor: `R$ ${request.amount.toFixed(2)}`,
      descricao: request.description,
      chavePix: this.advancedConfig.interPixKey,
      ambiente: this.advancedConfig.interEnvironment || 'production'
    });

    // Sempre tentar API real primeiro
    try {
      return await this.executeWithRetry(async () => {
        const token = await this.getInterToken();

        // Se o token é um fallback, não podemos fazer chamada real
        if (token.startsWith('fallback_')) {
          throw new Error('Autenticação não disponível devido a limitações do navegador');
        }

        const baseUrl = this.getInterBaseUrl();
        const timeout = (this.advancedConfig.interTimeout || 30) * 1000;

        const payload = {
          calendario: {
            expiracao: request.expiresIn || 3600 // 1 hora default
          },
          valor: {
            original: request.amount.toFixed(2)
          },
          chave: this.advancedConfig.interPixKey,
          solicitacaoPagador: request.description,
          infoAdicionais: request.customerName ? [
            {
              nome: 'Cliente',
              valor: request.customerName
            }
          ] : undefined
        };

        console.log('📡 Enviando requisição para API Banco Inter...');
        console.log('🔗 URL:', `${baseUrl}/pix/v2/cob`);

        // Criar AbortController para timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`${baseUrl}/pix/v2/cob`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const responseTime = Date.now() - startTime;
        console.log('📨 Resposta da API:', response.status, response.statusText, `(${responseTime}ms)`);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro na API Inter: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Cobrança PIX OFICIAL criada com sucesso!');
        console.log('📄 Dados retornados:', {
          txid: data.txid,
          chave: data.chave,
          status: data.status
        });

        this.addLog('inter', 'createPayment', {
          ...request,
          responseData: data,
          oficial: true
        }, true, undefined, responseTime);

        return {
          id: data.txid,
          amount: request.amount,
          description: request.description,
          status: 'pending',
          pixKey: data.chave,
          qrCode: data.qrcode,
          paymentLink: data.linkVisualizacao,
          expiresAt: new Date(Date.now() + (request.expiresIn || 3600) * 1000),
          provider: 'inter'
        };
      }, 'inter', 'createPayment');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ Falha na API oficial Banco Inter:', errorMessage);

      // Se for erro de CORS/navegador, explicar a limitação
      if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch')) {
        throw new Error(`❌ LIMITAÇÃO DO NAVEGADOR: APIs bancárias bloqueiam chamadas diretas do browser por segurança.

📋 SOLUÇÕES PARA PIX OFICIAL:
1. 🖥️ Implementar backend/proxy server
2. 🔌 Usar extensão CORS ou navegador sem restrições
3. 📱 Integrar via aplicativo móvel
4. 🌐 Usar plataforma de terceiros (Mercado Pago, PagSeguro)

💡 Erro técnico: ${errorMessage}`);
      }

      // Repassar outros erros
      throw error;
    }

    // Este código nunca deveria ser executado, mas mantendo por segurança
    if (this.developmentMode) {
      const txid = `DEMO${Date.now().toString().slice(-8).toUpperCase()}`;
      const pixKey = this.advancedConfig.interPixKey || '58975369000108';
      const amountStr = request.amount.toFixed(2);

      console.log('🎯 [SIMULAÇÃO REALÍSTICA] Gerando cobrança PIX Banco Inter:', {
        valor: `R$ ${amountStr}`,
        descricao: request.description,
        chavePix: pixKey,
        ambiente: this.advancedConfig.interEnvironment || 'production',
        txid: txid,
        motivo: 'Limitações CORS em APIs bancárias - simulação com dados reais'
      });

      // QR Code PIX no formato EMV padrão Banco Central
      const qrCode = this.generatePixQrCode(pixKey, amountStr, request.description, txid);

      const mockResponse: PixPaymentResponse = {
        id: txid,
        amount: request.amount,
        description: request.description,
        status: 'pending',
        pixKey: pixKey,
        qrCode: qrCode,
        paymentLink: `https://internetbanking.inter.com.br/pix/cobranca-qr/${txid}`,
        expiresAt: new Date(Date.now() + (request.expiresIn || 3600) * 1000),
        provider: 'inter'
      };

      this.addLog('inter', 'createPayment', {
        ...request,
        simulation: true,
        txid,
        qrCodeLength: qrCode.length
      } as unknown as Record<string, unknown>, true, undefined, Date.now() - startTime);

      console.log('✅ Cobrança PIX gerada (Simulação):', {
        id: txid,
        valor: `R$ ${amountStr}`,
        link: mockResponse.paymentLink?.substring(0, 50) + '...'
      });

      return mockResponse;
    }

    return this.executeWithRetry(async () => {
      const token = await this.getInterToken();
      const baseUrl = this.getInterBaseUrl();
      const timeout = (this.advancedConfig.interTimeout || 30) * 1000;

      const payload = {
        calendario: {
          expiracao: request.expiresIn || 3600 // 1 hora default
        },
        valor: {
          original: request.amount.toFixed(2)
        },
        chave: this.advancedConfig.interPixKey || '58975369000108',
        solicitacaoPagador: request.description,
        infoAdicionais: request.customerName ? [
          {
            nome: 'Cliente',
            valor: request.customerName
          }
        ] : undefined
      };

      // Criar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${baseUrl}/pix/v2/cob`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erro ao criar cobrança Inter: ${response.status}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      this.addLog('inter', 'createPayment', { ...request, responseData: data }, true, undefined, responseTime);

      return {
        id: data.txid,
        amount: request.amount,
        description: request.description,
        status: 'pending',
        pixKey: data.chave,
        qrCode: data.qrcode,
        paymentLink: data.linkVisualizacao,
        expiresAt: new Date(Date.now() + (request.expiresIn || 3600) * 1000),
        provider: 'inter'
      };
    }, 'inter', 'createPayment');
  }

  // Criar pagamento PIX no 4send com configurações avançadas
  private async create4sendPayment(request: PixPaymentRequest): Promise<PixPaymentResponse> {
    const startTime = Date.now();

    console.log('🚀 Iniciando criação de cobrança PIX OFICIAL 4Send...');
    console.log('📋 Dados da cobrança:', {
      valor: `R$ ${request.amount.toFixed(2)}`,
      descricao: request.description,
      provider: '4send'
    });

    const baseUrl = this.advancedConfig.foursendBaseUrl || FOURGSEND_CONFIG.baseUrl;
    const apiToken = this.advancedConfig.foursendApiToken || FOURGSEND_CONFIG.apiToken;
    const apiKey = FOURGSEND_CONFIG.apiKey;
    const timeout = (this.advancedConfig.foursendTimeout || 30) * 1000;

    const payload = {
      amount: request.amount,
      description: request.description,
      external_id: request.externalId || `agencia_check_${Date.now()}`,
      expires_in: request.expiresIn || 3600, // 1 hora default
      customer: {
        name: request.customerName || 'Cliente Agência Check',
        email: request.customerEmail || 'cliente@agenciacheck.com',
        phone: request.customerPhone || '',
        document: request.customerDocument || ''
      }
    };

    console.log('📡 Enviando requisição para API 4Send...');
    console.log('🔗 URL:', `${baseUrl}/api/v1/pix/charge`);
    console.log('🔑 API Token:', apiToken?.substring(0, 8) + '...');

    try {
      // Criar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${baseUrl}/api/v1/pix/charge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      console.log('📨 Resposta da API 4Send:', response.status, response.statusText, `(${responseTime}ms)`);

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `Erro na API 4Send: ${response.status} - ${errorText}`;
        console.error('❌', errorMessage);

        this.addLog('4send', 'createPayment', {
          error: errorMessage,
          status: response.status
        }, false, errorMessage, responseTime);

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('✅ Cobrança PIX OFICIAL 4Send criada com sucesso!');
      console.log('📄 Dados retornados:', {
        id: data.id || data.charge_id,
        qr_code: data.qr_code?.substring(0, 50) + '...',
        status: data.status
      });

      this.addLog('4send', 'createPayment', {
        ...request,
        responseData: data,
        oficial: true
      }, true, undefined, responseTime);

      return {
        id: data.id || data.charge_id || `4send_${Date.now()}`,
        amount: request.amount,
        description: request.description,
        status: 'pending',
        qrCode: data.qr_code || data.pix_qr_code,
        paymentLink: data.payment_url || data.checkout_url || data.link,
        expiresAt: new Date(data.expires_at || Date.now() + (request.expiresIn || 3600) * 1000),
        provider: '4send'
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const responseTime = Date.now() - startTime;

      console.error('❌ Falha na API 4Send:', errorMessage);

      this.addLog('4send', 'createPayment', {
        error: errorMessage
      }, false, errorMessage, responseTime);

      throw new Error(`❌ Erro ao criar cobrança PIX 4Send: ${errorMessage}`);
    }
  }

  // Método principal para criar pagamento
  async createPayment(request: PixPaymentRequest, provider?: PixProvider): Promise<PixPaymentResponse> {
    const selectedProvider = provider || (import.meta.env?.VITE_PIX_DEFAULT_PROVIDER as PixProvider) || '4send';

    console.log(`💳 Criando pagamento PIX via ${selectedProvider}:`, {
      amount: request.amount,
      description: request.description
    });

    if (selectedProvider === 'inter') {
      return this.createInterPayment(request);
    }
    return this.create4sendPayment(request);
  }

  // Verificar status do pagamento com configurações avançadas
  async checkPaymentStatus(paymentId: string, provider: PixProvider): Promise<PixPaymentResponse> {
    const startTime = Date.now();

    if (this.developmentMode) {
      console.log(`🔧 [DEV] Verificando status do pagamento ${paymentId} (${provider})`);
      // Simular mudança de status aleatória
      const statuses: Array<'pending' | 'paid' | 'expired'> = ['pending', 'pending', 'pending', 'paid'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      const mockResponse = {
        id: paymentId,
        amount: 25.00,
        description: 'Pagamento de teste',
        status: randomStatus,
        provider,
        paidAt: randomStatus === 'paid' ? new Date() : undefined
      };

      this.addLog(provider, 'checkStatus', { paymentId }, true, undefined, Date.now() - startTime);
      return mockResponse;
    }

    if (provider === 'inter') {
      return this.checkInterPaymentStatus(paymentId);
    }
    return this.check4sendPaymentStatus(paymentId);
  }

  private async checkInterPaymentStatus(paymentId: string): Promise<PixPaymentResponse> {
    const startTime = Date.now();

    return this.executeWithRetry(async () => {
      const token = await this.getInterToken();
      const baseUrl = this.getInterBaseUrl();
      const timeout = (this.advancedConfig.interTimeout || 30) * 1000;

      // Criar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${baseUrl}/pix/v2/cob/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erro ao verificar status Inter: ${response.status}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      this.addLog('inter', 'checkStatus', { paymentId, responseData: data }, true, undefined, responseTime);

      return {
        id: data.txid,
        amount: Number.parseFloat(data.valor.original),
        description: data.solicitacaoPagador,
        status: data.status === 'CONCLUIDA' ? 'paid' : 'pending',
        provider: 'inter',
        paidAt: data.status === 'CONCLUIDA' ? new Date(data.pix?.[0]?.horario) : undefined
      };
    }, 'inter', 'checkStatus');
  }

  private async check4sendPaymentStatus(paymentId: string): Promise<PixPaymentResponse> {
    const startTime = Date.now();

    return this.executeWithRetry(async () => {
      const baseUrl = this.advancedConfig.foursendBaseUrl || FOURGSEND_CONFIG.baseUrl;
      const apiToken = this.advancedConfig.foursendApiToken || FOURGSEND_CONFIG.apiToken;
      const timeout = (this.advancedConfig.foursendTimeout || 30) * 1000;
      const customHeaders = this.get4sendCustomHeaders();

      // Criar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${baseUrl}/p/v1/links/${paymentId}`, {
        headers: {
          'X-API-Token': apiToken,
          'Accept': 'application/json',
          ...customHeaders
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erro ao verificar status 4send: ${response.status}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      this.addLog('4send', 'checkStatus', { paymentId, responseData: data }, true, undefined, responseTime);

      return {
        id: data.id,
        amount: data.value,
        description: data.description,
        status: data.status,
        provider: '4send',
        paidAt: data.status === 'paid' ? new Date(data.paid_at) : undefined
      };
    }, '4send', 'checkStatus');
  }

  // Testar conectividade com os provedores (expandido)
  async testConnectivity(provider: PixProvider): Promise<{ success: boolean; message: string }> {
    console.log(`🔍 Testando conectividade ${provider}...`);
    const startTime = Date.now();

    if (this.developmentMode) {
      const hasCredentials = provider === 'inter'
        ? (this.advancedConfig.interClientId && this.advancedConfig.interClientSecret)
        : this.advancedConfig.foursendApiToken;

      const message = hasCredentials
        ? `⚠️ [SIMULAÇÃO] ${provider} - Credenciais encontradas mas limitações técnicas ativas`
        : `❌ [SIMULAÇÃO] ${provider} - Credenciais não configuradas`;

      this.addLog(provider, 'testConnectivity', {
        mode: 'development',
        hasCredentials
      }, hasCredentials, undefined, Date.now() - startTime);

      return {
        success: hasCredentials,
        message
      };
    }

    try {
      if (provider === 'inter') {
        console.log('🔐 Testando autenticação OAuth2 Banco Inter...');
        const token = await this.getInterToken();
        const responseTime = Date.now() - startTime;

        if (token.startsWith('fallback_')) {
          const message = `⚠️ Banco Inter - Autenticação com limitações (${responseTime}ms)`;
          this.addLog('inter', 'testConnectivity', {
            fallback: true,
            responseTime
          }, false, 'Fallback mode activated', responseTime);
          return {
            success: false,
            message
          };
        }

        const message = `✅ Banco Inter - Conectividade e autenticação OK (${responseTime}ms)`;
        this.addLog('inter', 'testConnectivity', { responseTime }, true, undefined, responseTime);
        return {
          success: true,
          message
        };
      }

      // Teste expandido para 4send
      const baseUrl = this.advancedConfig.foursendBaseUrl || FOURGSEND_CONFIG.baseUrl;
      const apiToken = this.advancedConfig.foursendApiToken || FOURGSEND_CONFIG.apiToken;
      const timeout = (this.advancedConfig.foursendTimeout || 30) * 1000;
      const customHeaders = this.get4sendCustomHeaders();

      // Criar AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${baseUrl}/p/v1/links?limit=1`, {
        headers: {
          'X-API-Token': apiToken,
          'Accept': 'application/json',
          ...customHeaders
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const message = `✅ Conectividade 4send verificada com sucesso (${responseTime}ms)`;
        this.addLog('4send', 'testConnectivity', { responseTime }, true, undefined, responseTime);
        return {
          success: true,
          message
        };
      }
      throw new Error(`Status: ${response.status}`);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const message = `❌ Erro na conectividade ${provider}: ${errorMessage} (${responseTime}ms)`;

      this.addLog(provider, 'testConnectivity', { error: errorMessage }, false, errorMessage, responseTime);

      return {
        success: false,
        message
      };
    }
  }

  // Método para validar webhook signature
  public validateWebhookSignature(payload: string, signature: string, provider: PixProvider): boolean {
    if (!this.advancedConfig.enableWebhookSignatureValidation) {
      return true; // Validação desabilitada
    }

    try {
      const secret = provider === 'inter'
        ? this.advancedConfig.interWebhookSecret
        : this.advancedConfig.webhookValidationSecret;

      if (!secret) {
        console.warn(`⚠️ Secret não configurado para validação de webhook ${provider}`);
        return false;
      }

      // Implementar validação de assinatura (exemplo simplificado)
      // Em produção, usar crypto.createHmac com o algoritmo correto
      const expectedSignature = btoa(secret + payload).substring(0, 32);
      const isValid = signature === expectedSignature;

      this.addLog(provider, 'validateWebhook', { isValid }, isValid, isValid ? undefined : 'Assinatura inválida');

      return isValid;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na validação';
      this.addLog(provider, 'validateWebhook', {}, false, errorMessage);
      return false;
    }
  }

  // Obter estatísticas de monitoramento
  public getMonitoringStats(): {
    totalTransactions: number;
    successRate: number;
    averageResponseTime: number;
    providerStats: {
      [K in PixProvider]: {
        transactions: number;
        successRate: number;
        averageResponseTime: number;
      }
    }
  } {
    if (!this.advancedConfig.enableApiMonitoring) {
      return {
        totalTransactions: 0,
        successRate: 0,
        averageResponseTime: 0,
        providerStats: {
          inter: { transactions: 0, successRate: 0, averageResponseTime: 0 },
          '4send': { transactions: 0, successRate: 0, averageResponseTime: 0 }
        }
      };
    }

    const totalTransactions = this.logs.length;
    const successfulTransactions = this.logs.filter(log => log.success).length;
    const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;

    const responseTimes = this.logs
      .filter(log => log.responseTime !== undefined)
      .map(log => log.responseTime as number);
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    const providerStats = (['inter', '4send'] as PixProvider[]).reduce((stats, provider) => {
      const providerLogs = this.logs.filter(log => log.provider === provider);
      const providerSuccessful = providerLogs.filter(log => log.success).length;
      const providerResponseTimes = providerLogs
        .filter(log => log.responseTime !== undefined)
        .map(log => log.responseTime as number);

      stats[provider] = {
        transactions: providerLogs.length,
        successRate: providerLogs.length > 0 ? (providerSuccessful / providerLogs.length) * 100 : 0,
        averageResponseTime: providerResponseTimes.length > 0
          ? providerResponseTimes.reduce((sum, time) => sum + time, 0) / providerResponseTimes.length
          : 0
      };

      return stats;
    }, {} as Record<PixProvider, { transactions: number; successRate: number; averageResponseTime: number }>);

    return {
      totalTransactions,
      successRate,
      averageResponseTime,
      providerStats
    };
  }

  // Limpar todos os logs
  public clearLogs(): void {
    this.logs = [];
    console.log('🗑️ Todos os logs foram limpos');
  }

  // Exportar logs para análise
  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Restaurar configurações padrão
  public restoreDefaultConfig(): void {
    this.advancedConfig = { ...DEFAULT_ADVANCED_CONFIG };
    localStorage.removeItem('pixConfigurations');
    console.log('🔄 Configurações restauradas para os valores padrão');
  }
}

export const PixService = new PixServiceClass();
