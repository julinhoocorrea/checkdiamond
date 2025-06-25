import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, UserX, Phone, Mail, CreditCard, TrendingUp, Settings, Send, Eye, EyeOff, Loader2, CheckCircle, Copy } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useDataStore } from '@/stores/data';
import { EmailService } from '@/services/emailService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Revendedor, UserPermissions } from '@/types';

const revendedorSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  whatsapp: z.string().min(10, 'WhatsApp deve ter pelo menos 10 dígitos'),
  comission: z.number().min(0).max(100, 'Comissão deve estar entre 0 e 100%'),
});

type RevendedorForm = z.infer<typeof revendedorSchema>;

interface RevendedorModalProps {
  revendedor?: Revendedor;
  open: boolean;
  onClose: () => void;
}

const defaultPermissions: UserPermissions = {
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

function RevendedorModal({ revendedor, open, onClose }: RevendedorModalProps) {
  const { addRevendedor, updateRevendedor } = useDataStore();
  const [permissions, setPermissions] = useState<UserPermissions>(
    revendedor?.permissions || defaultPermissions
  );
  const [isSending, setIsSending] = useState(false);
  const [emailResult, setEmailResult] = useState<{
    success: boolean;
    message: string;
    password?: string;
    emailPreview?: string;
  } | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const isEditing = !!revendedor;
  const emailService = EmailService.getInstance();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RevendedorForm>({
    resolver: zodResolver(revendedorSchema),
    defaultValues: revendedor ? {
      name: revendedor.name,
      email: revendedor.email,
      phone: revendedor.phone,
      whatsapp: revendedor.whatsapp,
      comission: revendedor.comission,
    } : {
      name: '',
      email: '',
      phone: '',
      whatsapp: '',
      comission: 1.5,
    }
  });

  const updatePermission = (path: string, value: boolean) => {
    setPermissions(prev => {
      const newPermissions = { ...prev };
      const keys = path.split('.');

      if (keys.length === 1) {
        (newPermissions as unknown as Record<string, unknown>)[keys[0]] = value;
      } else if (keys.length === 2) {
        const section = (newPermissions as unknown as Record<string, Record<string, unknown>>)[keys[0]];
        if (section) {
          section[keys[1]] = value;
        }
      }

      return newPermissions;
    });
  };

  const onSubmit = async (data: RevendedorForm) => {
    try {
      setIsSending(true);
      setEmailResult(null);

      const revendedorData = {
        ...data,
        permissions,
      };

      if (isEditing) {
        updateRevendedor(revendedor.id, revendedorData);
        setEmailResult({
          success: true,
          message: 'Revendedor atualizado com sucesso!'
        });
      } else {
        // Gerar senha temporária
        const tempPassword = emailService.generateTempPassword();

        // Criar revendedor
        addRevendedor({
          ...revendedorData,
          password: tempPassword,
          temporaryPassword: true,
        });

        // Formatar permissões para email
        const formattedPermissions = emailService.formatPermissions(permissions);

        // Enviar email com credenciais
        const emailResult = await emailService.sendRevendedorCredentials(
          { name: data.name, email: data.email },
          tempPassword,
          formattedPermissions
        );

        setEmailResult(emailResult);
      }

      if (!isEditing) {
        reset();
        setPermissions(defaultPermissions);
      }

    } catch (error) {
      setEmailResult({
        success: false,
        message: 'Erro ao cadastrar revendedor. Tente novamente.'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setEmailResult(null);
    setShowEmailPreview(false);
    reset();
    setPermissions(defaultPermissions);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Revendedor' : 'Novo Revendedor'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações do revendedor'
              : 'Cadastre um novo revendedor e configure suas permissões de acesso'
            }
          </DialogDescription>
        </DialogHeader>

        {emailResult && (
          <Alert className={emailResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            <CheckCircle className={`h-4 w-4 ${emailResult.success ? 'text-green-600' : 'text-red-600'}`} />
            <AlertDescription className={emailResult.success ? 'text-green-800' : 'text-red-800'}>
              <div className="font-medium mb-2">{emailResult.message}</div>

              {emailResult.password && (
                <div className="mt-3 p-3 bg-white border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>Senha temporária gerada:</strong>
                      <code className="ml-2 bg-gray-100 px-2 py-1 rounded font-mono">{emailResult.password}</code>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(emailResult.password || '')}
                      className="gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Copiar
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-3">
                {emailResult.emailPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEmailPreview(!showEmailPreview)}
                    className="gap-2"
                  >
                    {showEmailPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showEmailPreview ? 'Ocultar' : 'Ver'} Preview
                  </Button>
                )}

                {emailResult.success && emailResult.message.includes('clipboard') && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Tentar abrir cliente de email com dados
                      const subject = encodeURIComponent('🎉 Bem-vindo à Agência Check - Suas credenciais de acesso');
                      const body = encodeURIComponent(`Credenciais de acesso:\nSenha: ${emailResult.password || ''}`);
                      window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
                    }}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Abrir Email
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {showEmailPreview && emailResult?.emailPreview && (
          <div className="border rounded-lg p-4 bg-slate-50">
            <h4 className="font-medium mb-2">Preview do Email Enviado:</h4>
            <div className="border rounded bg-white p-4 max-h-96 overflow-y-auto">
              <div>{emailResult.emailPreview && 'Preview disponível'}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                placeholder="Nome do revendedor"
                {...register('name')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
              <p className="text-xs text-slate-500">
                💌 Credenciais de acesso serão enviadas para este email
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                {...register('phone')}
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                placeholder="(11) 99999-9999"
                {...register('whatsapp')}
                className={errors.whatsapp ? 'border-red-500' : ''}
              />
              {errors.whatsapp && (
                <p className="text-sm text-red-500">{errors.whatsapp.message}</p>
              )}
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="comission">Comissão (%)</Label>
              <Input
                id="comission"
                type="number"
                step="0.1"
                min="0"
                max="100"
                {...register('comission', { valueAsNumber: true })}
                className={errors.comission ? 'border-red-500' : ''}
              />
              {errors.comission && (
                <p className="text-sm text-red-500">{errors.comission.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Permissões de Acesso</h3>
            </div>
            <p className="text-sm text-slate-600">
              Configure quais módulos e ações este revendedor pode acessar no sistema
            </p>

            <div className="grid gap-4 p-4 border rounded-lg bg-slate-50">
              {/* Dashboard */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dashboard"
                  checked={permissions.dashboard}
                  onCheckedChange={(checked) => updatePermission('dashboard', checked as boolean)}
                />
                <Label htmlFor="dashboard" className="font-medium">📊 Dashboard</Label>
                <span className="text-sm text-slate-600">- Visualizar métricas e relatórios</span>
              </div>

              {/* Vendas */}
              <div className="space-y-2">
                <Label className="font-medium text-blue-600">🛒 Vendas</Label>
                <div className="grid grid-cols-2 gap-2 ml-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vendas-view"
                      checked={permissions.vendas.view}
                      onCheckedChange={(checked) => updatePermission('vendas.view', checked as boolean)}
                    />
                    <Label htmlFor="vendas-view" className="text-sm">Visualizar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vendas-create"
                      checked={permissions.vendas.create}
                      onCheckedChange={(checked) => updatePermission('vendas.create', checked as boolean)}
                    />
                    <Label htmlFor="vendas-create" className="text-sm">Criar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vendas-edit"
                      checked={permissions.vendas.edit}
                      onCheckedChange={(checked) => updatePermission('vendas.edit', checked as boolean)}
                    />
                    <Label htmlFor="vendas-edit" className="text-sm">Editar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vendas-delete"
                      checked={permissions.vendas.delete}
                      onCheckedChange={(checked) => updatePermission('vendas.delete', checked as boolean)}
                    />
                    <Label htmlFor="vendas-delete" className="text-sm">Excluir</Label>
                  </div>
                </div>
              </div>

              {/* Revendedores */}
              <div className="space-y-2">
                <Label className="font-medium text-green-600">👥 Revendedores</Label>
                <div className="grid grid-cols-2 gap-2 ml-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="revendedores-view"
                      checked={permissions.revendedores.view}
                      onCheckedChange={(checked) => updatePermission('revendedores.view', checked as boolean)}
                    />
                    <Label htmlFor="revendedores-view" className="text-sm">Visualizar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="revendedores-create"
                      checked={permissions.revendedores.create}
                      onCheckedChange={(checked) => updatePermission('revendedores.create', checked as boolean)}
                    />
                    <Label htmlFor="revendedores-create" className="text-sm">Criar</Label>
                  </div>
                </div>
              </div>

              {/* Estoque */}
              <div className="space-y-2">
                <Label className="font-medium text-purple-600">📦 Estoque</Label>
                <div className="grid grid-cols-2 gap-2 ml-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="estoque-view"
                      checked={permissions.estoque.view}
                      onCheckedChange={(checked) => updatePermission('estoque.view', checked as boolean)}
                    />
                    <Label htmlFor="estoque-view" className="text-sm">Visualizar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="estoque-create"
                      checked={permissions.estoque.create}
                      onCheckedChange={(checked) => updatePermission('estoque.create', checked as boolean)}
                    />
                    <Label htmlFor="estoque-create" className="text-sm">Adicionar itens</Label>
                  </div>
                </div>
              </div>

              {/* Pagamentos */}
              <div className="space-y-2">
                <Label className="font-medium text-orange-600">💳 Pagamentos</Label>
                <div className="grid grid-cols-2 gap-2 ml-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pagamentos-view"
                      checked={permissions.pagamentos.view}
                      onCheckedChange={(checked) => updatePermission('pagamentos.view', checked as boolean)}
                    />
                    <Label htmlFor="pagamentos-view" className="text-sm">Visualizar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pagamentos-manage"
                      checked={permissions.pagamentos.manage}
                      onCheckedChange={(checked) => updatePermission('pagamentos.manage', checked as boolean)}
                    />
                    <Label htmlFor="pagamentos-manage" className="text-sm">Gerenciar</Label>
                  </div>
                </div>
              </div>

              {/* Envios */}
              <div className="space-y-2">
                <Label className="font-medium text-red-600">🚚 Envios</Label>
                <div className="grid grid-cols-2 gap-2 ml-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="envios-view"
                      checked={permissions.envios.view}
                      onCheckedChange={(checked) => updatePermission('envios.view', checked as boolean)}
                    />
                    <Label htmlFor="envios-view" className="text-sm">Visualizar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="envios-manage"
                      checked={permissions.envios.manage}
                      onCheckedChange={(checked) => updatePermission('envios.manage', checked as boolean)}
                    />
                    <Label htmlFor="envios-manage" className="text-sm">Gerenciar</Label>
                  </div>
                </div>
              </div>

              {/* Relatórios */}
              <div className="space-y-2">
                <Label className="font-medium text-indigo-600">📊 Relatórios</Label>
                <div className="grid grid-cols-2 gap-2 ml-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="relatorios-view"
                      checked={permissions.relatorios.view}
                      onCheckedChange={(checked) => updatePermission('relatorios.view', checked as boolean)}
                    />
                    <Label htmlFor="relatorios-view" className="text-sm">Visualizar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="relatorios-export"
                      checked={permissions.relatorios.export}
                      onCheckedChange={(checked) => updatePermission('relatorios.export', checked as boolean)}
                    />
                    <Label htmlFor="relatorios-export" className="text-sm">Exportar</Label>
                  </div>
                </div>
              </div>

              {/* Configurações */}
              <div className="space-y-2">
                <Label className="font-medium text-gray-600">⚙️ Configurações</Label>
                <div className="grid grid-cols-2 gap-2 ml-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="configuracoes-view"
                      checked={permissions.configuracoes.view}
                      onCheckedChange={(checked) => updatePermission('configuracoes.view', checked as boolean)}
                    />
                    <Label htmlFor="configuracoes-view" className="text-sm">Visualizar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="configuracoes-edit"
                      checked={permissions.configuracoes.edit}
                      onCheckedChange={(checked) => updatePermission('configuracoes.edit', checked as boolean)}
                    />
                    <Label htmlFor="configuracoes-edit" className="text-sm">Editar</Label>
                  </div>
                </div>
              </div>

              {/* IA Ana */}
              <div className="space-y-2">
                <Label className="font-medium text-cyan-600">🤖 IA Ana</Label>
                <div className="grid grid-cols-2 gap-2 ml-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ia-view"
                      checked={permissions.ia.view}
                      onCheckedChange={(checked) => updatePermission('ia.view', checked as boolean)}
                    />
                    <Label htmlFor="ia-view" className="text-sm">Visualizar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ia-configure"
                      checked={permissions.ia.configure}
                      onCheckedChange={(checked) => updatePermission('ia.configure', checked as boolean)}
                    />
                    <Label htmlFor="ia-configure" className="text-sm">Configurar</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              className="flex-1 gap-2"
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEditing ? 'Atualizando...' : 'Cadastrando e enviando email...'}
                </>
              ) : (
                <>
                  {isEditing ? <Edit className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  {isEditing ? 'Atualizar Revendedor' : 'Cadastrar e Enviar Acesso'}
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Revendedores() {
  const { revendedores, removeRevendedor } = useDataStore();
  const [selectedRevendedor, setSelectedRevendedor] = useState<Revendedor | undefined>();
  const [showModal, setShowModal] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleEdit = (revendedor: Revendedor) => {
    setSelectedRevendedor(revendedor);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedRevendedor(undefined);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRevendedor(undefined);
  };

  const getPermissionCount = (permissions: UserPermissions) => {
    if (!permissions) return 0;

    let count = 0;
    if (permissions.dashboard) count++;

    count += Object.values(permissions.vendas || {}).filter(Boolean).length;
    count += Object.values(permissions.revendedores || {}).filter(Boolean).length;
    count += Object.values(permissions.estoque || {}).filter(Boolean).length;
    count += Object.values(permissions.pagamentos || {}).filter(Boolean).length;
    count += Object.values(permissions.envios || {}).filter(Boolean).length;
    count += Object.values(permissions.relatorios || {}).filter(Boolean).length;
    count += Object.values(permissions.configuracoes || {}).filter(Boolean).length;
    count += Object.values(permissions.ia || {}).filter(Boolean).length;

    return count;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Revendedores</h1>
          <p className="text-slate-600 mt-1">
            Gerencie revendedores e configure permissões com envio automático de credenciais por email
          </p>
        </div>

        <Button className="gap-2" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          Novo Revendedor
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 md:grid-cols-4"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revendedores</CardTitle>
            <CreditCard className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revendedores.length}</div>
            <p className="text-xs text-slate-600">Cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revendedores Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revendedores.filter(r => r.isActive).length}
            </div>
            <p className="text-xs text-slate-600">Em atividade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revendedores.reduce((sum: number, r) => sum + r.totalSales, 0))}
            </div>
            <p className="text-xs text-slate-600">Valor total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Pendente</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revendedores.reduce((sum: number, r) => sum + r.balance, 0))}
            </div>
            <p className="text-xs text-slate-600">A pagar</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Lista de Revendedores</CardTitle>
            <CardDescription>
              Gerencie revendedores, configure permissões e envie credenciais automaticamente por email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Revendedor</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Comissão</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revendedores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                        Nenhum revendedor cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    revendedores.map(revendedor => (
                      <TableRow key={revendedor.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {revendedor.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{revendedor.name}</div>
                              <div className="text-sm text-slate-500">{revendedor.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {revendedor.phone}
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3" />
                              {revendedor.whatsapp}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{revendedor.comission}%</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{formatCurrency(revendedor.totalSales)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{formatCurrency(revendedor.balance)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getPermissionCount(revendedor.permissions)} permissões
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={revendedor.isActive ? "default" : "secondary"}>
                            {revendedor.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(revendedor)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeRevendedor(revendedor.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <UserX className="h-3 w-3" />
                            </Button>
                          </div>
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

      <RevendedorModal
        revendedor={selectedRevendedor}
        open={showModal}
        onClose={handleCloseModal}
      />
    </div>
  );
}
