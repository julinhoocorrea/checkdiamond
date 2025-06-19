interface WebhookData {
  id: string;
  status: string;
  [key: string]: unknown;
}

export class WebhookService {
  private static instance: WebhookService;
  private listeners: ((webhook: WebhookData) => void)[] = [];

  static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  addListener(callback: (webhook: WebhookData) => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (webhook: WebhookData) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners(webhook: WebhookData): void {
    for (const listener of this.listeners) {
      listener(webhook);
    }
  }

  async sendWebhook(url: string, data: Record<string, unknown>): Promise<void> {
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('Webhook error:', error);
    }
  }

  async notifyVendaCompleted(venda: Record<string, unknown>): Promise<void> {
    // Implementar notificação de venda completada
    console.log('Venda completada:', venda);
  }

  async notifyPaymentReceived(payment: WebhookData): Promise<void> {
    // Implementar notificação de pagamento recebido
    console.log('Pagamento recebido:', payment);
    this.notifyListeners(payment);
  }
}
