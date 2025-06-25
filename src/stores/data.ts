import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Revendedor, type Venda, type EstoqueItem, Estoque, type EstoqueMovimentacao, DashboardMetrics, type PendingPayment, PaymentWebhook, type DataState, type UserPermissions } from '@/types';
import { WebhookService } from '@/services/webhookService';

const webhookService = WebhookService.getInstance();

// Permissões padrão para revendedores
const defaultRevendedorPermissions: UserPermissions = {
  dashboard: true,
  vendas: {
    view: true,
    create: true,
    edit: false,
    delete: false,
  },
  revendedores: {
    view: false,
    create: false,
    edit: false,
    delete: false,
  },
  estoque: {
    view: true,
    create: false,
    edit: false,
    delete: false,
  },
  pagamentos: {
    view: false,
    manage: false,
  },
  envios: {
    view: true,
    manage: false,
  },
  relatorios: {
    view: true,
    export: false,
  },
  configuracoes: {
    view: false,
    edit: false,
  },
  ia: {
    view: false,
    configure: false,
  },
};

// Mock data
const mockRevendedores: Revendedor[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 99999-9999',
    whatsapp: '5511999999999',
    comission: 0.15,
    balance: 1250.75,
    totalSales: 45,
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date(),
    permissions: defaultRevendedorPermissions,
    password: 'temp123',
    temporaryPassword: true
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@email.com',
    phone: '(11) 88888-8888',
    whatsapp: '5511888888888',
    comission: 0.18,
    balance: 890.50,
    totalSales: 32,
    isActive: true,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date(),
    permissions: defaultRevendedorPermissions,
    password: 'temp456',
    temporaryPassword: true
  }
];

const mockVendas: Venda[] = [
  {
    id: '1',
    date: new Date('2024-12-10'),
    revendedorId: '1',
    revendedorName: 'João Silva',
    diamondQuantity: 1000,
    totalValue: 25.00,
    cost: 18.00,
    profit: 7.00,
    commission: 3.75,
    netProfit: 3.25,
    status: 'pago',
    deliveryStatus: 'entregue',
    kwaiId: 'kwai123',
  },
  {
    id: '2',
    date: new Date('2024-12-11'),
    revendedorId: '2',
    revendedorName: 'Maria Santos',
    diamondQuantity: 500,
    totalValue: 15.00,
    cost: 9.00,
    profit: 6.00,
    commission: 2.70,
    netProfit: 3.30,
    status: 'pendente',
    deliveryStatus: 'pendente'
  }
];

const mockEstoqueItems: EstoqueItem[] = [
  {
    id: '1',
    name: 'Diamantes Kwai 100',
    description: 'Pacote de 100 diamantes',
    quantity: 500,
    price: 2.50,
    cost: 1.80,
    supplier: 'Fornecedor A',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date()
  }
];

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      revendedores: mockRevendedores,
      vendas: mockVendas,
      estoque: {
        items: mockEstoqueItems,
        currentStock: mockEstoqueItems.reduce((total, item) => total + item.quantity, 0),
        movimentacoes: []
      },
      iaConfigs: [
        {
          id: '1',
          command: 'preço',
          response: 'O preço dos diamantes é R$ 0,025 por unidade.',
          isActive: true
        }
      ],
      pendingPayments: [],
      webhooks: [],

      // Revendedor Actions
      addRevendedor: (revendedor: Omit<Revendedor, 'id' | 'balance' | 'totalSales' | 'isActive' | 'createdAt' | 'updatedAt'> & { permissions?: UserPermissions }) => {
        const newRevendedor: Revendedor = {
          ...revendedor,
          id: Math.random().toString(36).substr(2, 9),
          balance: 0,
          totalSales: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          permissions: revendedor.permissions || defaultRevendedorPermissions
        };
        set((state: DataState) => ({
          revendedores: [...state.revendedores, newRevendedor]
        }));
      },

      updateRevendedor: (id, data) => {
        set((state) => ({
          revendedores: state.revendedores.map(revendedor =>
            revendedor.id === id ? { ...revendedor, ...data, updatedAt: new Date() } : revendedor
          )
        }));
      },

      removeRevendedor: (id) => {
        set((state) => ({
          revendedores: state.revendedores.filter(revendedor => revendedor.id !== id)
        }));
      },

      // Venda Actions
      addVenda: (venda) => {
        const cost = venda.diamondQuantity * 0.018; // R$ 0,018 por diamante
        const profit = venda.totalValue - cost;
        const commission = profit * 0.15; // 15% de comissão
        const netProfit = profit - commission;

        const newVenda: Venda = {
          ...venda,
          id: Math.random().toString(36).substr(2, 9),
          cost,
          profit,
          commission,
          netProfit
        };

        set((state) => ({
          vendas: [...state.vendas, newVenda],
          revendedores: state.revendedores.map(revendedor =>
            revendedor.id === venda.revendedorId
              ? {
                  ...revendedor,
                  balance: revendedor.balance + commission,
                  totalSales: revendedor.totalSales + 1,
                  updatedAt: new Date()
                }
              : revendedor
          )
        }));
      },

      updateVenda: (id, data) => {
        set((state) => ({
          vendas: state.vendas.map(venda =>
            venda.id === id ? { ...venda, ...data } : venda
          )
        }));
      },

      updateVendaStatus: (id, status) => {
        set((state) => ({
          vendas: state.vendas.map(venda =>
            venda.id === id ? { ...venda, status } : venda
          )
        }));
      },

      updateDeliveryStatus: (id, deliveryStatus, userId) => {
        set((state) => ({
          vendas: state.vendas.map(venda =>
            venda.id === id ? { ...venda, deliveryStatus } : venda
          )
        }));
      },

      // Estoque Actions
      addEstoqueItem: (item) => {
        const newItem: EstoqueItem = {
          ...item,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        set((state) => ({
          estoque: {
            ...state.estoque,
            items: [...state.estoque.items, newItem],
            currentStock: state.estoque.currentStock + newItem.quantity
          }
        }));
      },

      updateEstoqueItem: (id, data) => {
        set((state) => ({
          estoque: {
            ...state.estoque,
            items: state.estoque.items.map(item =>
              item.id === id ? { ...item, ...data, updatedAt: new Date() } : item
            )
          }
        }));
      },

      removeEstoqueItem: (id) => {
        set((state) => ({
          estoque: {
            ...state.estoque,
            items: state.estoque.items.filter(item => item.id !== id)
          }
        }));
      },

      addMovimentacao: (movimentacao) => {
        const newMovimentacao: EstoqueMovimentacao = {
          ...movimentacao,
          id: Math.random().toString(36).substr(2, 9),
          date: new Date()
        };
        set((state) => ({
          estoque: {
            ...state.estoque,
            movimentacoes: [...state.estoque.movimentacoes, newMovimentacao]
          }
        }));
      },

      updateItemQuantity: (itemId, quantity, type, reason) => {
        set((state) => {
          const item = state.estoque.items.find(i => i.id === itemId);
          if (!item) return state;

          const newQuantity = type === 'entrada'
            ? item.quantity + quantity
            : type === 'saida'
            ? item.quantity - quantity
            : quantity;

          const movimentacao: EstoqueMovimentacao = {
            id: Math.random().toString(36).substr(2, 9),
            itemId,
            itemName: item.name,
            type,
            quantity,
            reason,
            date: new Date(),
            userId: 'system'
          };

          return {
            estoque: {
              ...state.estoque,
              items: state.estoque.items.map(i =>
                i.id === itemId ? { ...i, quantity: newQuantity, updatedAt: new Date() } : i
              ),
              currentStock: state.estoque.currentStock + (type === 'entrada' ? quantity : -quantity),
              movimentacoes: [...state.estoque.movimentacoes, movimentacao]
            }
          };
        });
      },

      // Payment Actions
      addPendingPayment: (payment) => {
        const newPayment: PendingPayment = {
          ...payment,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date()
        };
        set((state) => ({
          pendingPayments: [...state.pendingPayments, newPayment]
        }));
      },

      updatePaymentStatus: (paymentId, status, paidAt) => {
        set((state) => ({
          pendingPayments: state.pendingPayments.map(payment =>
            payment.id === paymentId ? { ...payment, status, paidAt } : payment
          )
        }));
      },

      processPaymentWebhook: (webhook) => {
        const state = get();
        const payment = state.pendingPayments.find((p: PendingPayment) => p.id === webhook.paymentId);
        if (!payment) return false;

        state.updatePaymentStatus(webhook.paymentId, 'paid', new Date());
        state.createVendaFromPayment(webhook.paymentId);
        return true;
      },

      createVendaFromPayment: (paymentId) => {
        const state = get();
        const payment = state.pendingPayments.find((p: PendingPayment) => p.id === paymentId);
        if (!payment) return false;

        let onlineRevendedor = state.revendedores.find((r: Revendedor) => r.name === 'Vendas Online');
        if (!onlineRevendedor) {
          state.addRevendedor({
            name: 'Vendas Online',
            email: 'vendas@sistema.com',
            phone: '',
            whatsapp: '',
            comission: 0,
            permissions: defaultRevendedorPermissions
          });
          onlineRevendedor = state.revendedores.find((r: Revendedor) => r.name === 'Vendas Online');
          if (!onlineRevendedor) return false;
        }

        state.addVenda({
          date: payment.paidAt || payment.createdAt,
          revendedorId: onlineRevendedor.id,
          revendedorName: 'Vendas Online',
          diamondQuantity: payment.diamondQuantity,
          totalValue: payment.totalValue,
          status: 'pago',
          deliveryStatus: 'pendente',
          kwaiId: payment.kwaiId,
          kwaiLink: `Venda Online - ${payment.customerName}`,
        });
        return true;
      },

      checkPaymentStatus: async (paymentId) => {
        try {
          const response = await fetch(`https://api.best4send.com/p/v1/links/${paymentId}`, {
            headers: {
              'X-API-Token': 'cm7domhw703b2q57w9fjaczfa',
              'Accept': 'application/json',
            },
          });
          const data = await response.json();
          if (data.status === 'paid') {
            get().updatePaymentStatus(paymentId, 'paid', new Date(data.paidAt));
          }
        } catch (error) {
          console.error('Erro ao verificar status do pagamento:', error);
        }
      },

      // Computed
      getDashboardMetrics: () => {
        const { vendas, revendedores } = get();
        const receitaBruta = vendas.reduce((total, venda) => total + venda.totalValue, 0);
        const lucroLiquido = vendas.reduce((total, venda) => total + venda.netProfit, 0);
        const totalVendas = vendas.length;
        const revendedoresAtivos = revendedores.filter(r => r.isActive).length;

        return {
          receitaBruta,
          lucroLiquido,
          totalVendas,
          revendedoresAtivos
        };
      },

      getChartData: () => {
        const { vendas } = get();
        return vendas.map(venda => ({
          date: venda.date.toISOString().split('T')[0],
          vendas: venda.totalValue,
          lucro: venda.netProfit
        }));
      }
    }),
    {
      name: 'agencia-data',
      partialize: (state) => ({
        revendedores: state.revendedores,
        vendas: state.vendas,
        estoque: state.estoque,
        iaConfigs: state.iaConfigs
      })
    }
  )
);
