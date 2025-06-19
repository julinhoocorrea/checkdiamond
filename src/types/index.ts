export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

export interface UserPermissions {
  dashboard: boolean;
  vendas: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  revendedores: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  estoque: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
  };
  pagamentos: {
    view: boolean;
    manage: boolean;
  };
  envios: {
    view: boolean;
    manage: boolean;
  };
  relatorios: {
    view: boolean;
    export: boolean;
  };
  configuracoes: {
    view: boolean;
    edit: boolean;
  };
  ia: {
    view: boolean;
    configure: boolean;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'revendedor';
  avatar?: string;
  permissions?: UserPermissions;
  createdAt?: Date;
  lastLogin?: Date;
  isActive?: boolean;
}

export interface Revendedor {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  comission: number; // percentual
  balance: number;
  totalSales: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  permissions: UserPermissions;
  password?: string; // Gerada automaticamente
  temporaryPassword?: boolean; // Se deve trocar na primeira vez
}

export interface Venda {
  id: string;
  date: Date;
  revendedorId: string;
  revendedorName: string;
  diamondQuantity: number;
  totalValue: number;
  cost: number;
  profit: number;
  commission: number;
  netProfit: number;
  status: 'pago' | 'pendente';
  deliveryStatus: 'pendente' | 'enviado' | 'entregue';
  deliveredAt?: Date;
  deliveredBy?: string;
  kwaiId?: string;
  kwaiLink?: string;
}

export interface EstoqueItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  cost: number;
  supplier: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EstoqueMovimentacao {
  id: string;
  type: 'entrada' | 'saida' | 'ajuste';
  itemId: string;
  itemName: string;
  quantity: number;
  reason: string;
  date: Date;
  userId: string;
}

export interface Estoque {
  items: EstoqueItem[];
  currentStock: number;
  movimentacoes: EstoqueMovimentacao[];
}

export interface DashboardMetrics {
  receitaBruta: number;
  lucroLiquido: number;
  diamantesVendidos: number;
  comissaoPaga: number;
  saldoConta: number;
}

export interface DashboardChartData {
  date: string;
  receita: number;
  lucro: number;
  comissao: number;
}

export interface IAConfig {
  id: string;
  command: string;
  response: string;
  isActive: boolean;
}

export interface DREReport {
  period: string;
  receitaBruta: number;
  cmv: number;
  lucroBruto: number;
  imposto: number; // 33%
  lucroLiquido: number;
  comissaoTotal: number;
  margemBruta: number; // %
}

// Constantes de negócio
export const BUSINESS_CONSTANTS = {
  DIAMOND_PRICE_REAL: 6.89, // R$ por 100 diamantes
  VET_COST: 0.07, // R$ por dólar
  COMMISSION_RATE: 1.5, // % comissão revendedor
  TAX_RATE: 33, // % imposto sobre lucro
  USD_DIAMONDS: 98, // diamantes por 1 USD
} as const;

export interface PaymentWebhook {
  id: string;
  status: 'pending' | 'paid' | 'cancelled' | 'expired';
  value: number;
  description: string;
  externalReference: string;
  paidAt?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    document: string;
  };
}

export interface PendingPayment {
  id: string;
  paymentId: string;
  kwaiId: string;
  diamondQuantity: number;
  totalValue: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCPF: string;
  status: 'pending' | 'paid' | 'processing' | 'cancelled';
  createdAt: Date;
  paidAt?: Date;
  paymentUrl: string;
  qrCode: string;
}

export interface PixAdvancedConfig {
  interClientId?: string;
  interClientSecret?: string;
  interCertPath?: string;
  interKeyPath?: string;
  interPixKey?: string;
  interEnvironment?: 'production' | 'sandbox';
}

export interface PixPaymentRequest {
  description: string;
  amount: number;
  pixProvider: 'inter' | '4send';
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  expiresIn?: number;
  customerDocument?: string;
  externalId?: string;
}

export interface DataState {
  revendedores: Revendedor[];
  vendas: Venda[];
  estoque: Estoque;
  iaConfigs: IAConfig[];
  pendingPayments: PendingPayment[];
  webhooks: PaymentWebhook[];

  // Revendedor Actions
  addRevendedor: (revendedor: Omit<Revendedor, 'id' | 'balance' | 'totalSales' | 'isActive' | 'createdAt' | 'updatedAt'> & { permissions?: UserPermissions }) => void;
  updateRevendedor: (id: string, data: Partial<Revendedor>) => void;
  removeRevendedor: (id: string) => void;

  // Venda Actions
  addVenda: (venda: Omit<Venda, 'id' | 'cost' | 'profit' | 'commission' | 'netProfit'>) => void;
  updateVenda: (id: string, data: Partial<Venda>) => void;
  updateVendaStatus: (id: string, status: Venda['status']) => void;
  updateDeliveryStatus: (id: string, deliveryStatus: Venda['deliveryStatus'], userId: string) => void;

  // Estoque Actions
  addEstoqueItem: (item: Omit<EstoqueItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEstoqueItem: (id: string, data: Partial<EstoqueItem>) => void;
  removeEstoqueItem: (id: string) => void;
  addMovimentacao: (movimentacao: Omit<EstoqueMovimentacao, 'id' | 'date'>) => void;
  updateItemQuantity: (itemId: string, quantity: number, type: EstoqueMovimentacao['type'], reason: string) => void;

  // Payment Actions
  addPendingPayment: (payment: Omit<PendingPayment, 'id' | 'createdAt'>) => void;
  updatePaymentStatus: (paymentId: string, status: PendingPayment['status'], paidAt?: Date) => void;
  processPaymentWebhook: (webhook: PaymentWebhook & { paymentId: string }) => boolean;
  createVendaFromPayment: (paymentId: string) => boolean;
  checkPaymentStatus: (paymentId: string) => Promise<void>;

  // Computed
  getDashboardMetrics: () => { receitaBruta: number; lucroLiquido: number; totalVendas: number; revendedoresAtivos: number; };
  getChartData: () => Array<{ date: string; vendas: number; lucro: number; }>;
}
