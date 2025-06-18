import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Package, TrendingUp, TrendingDown, Search, Edit2, Save, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDataStore } from '@/stores/data';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const itemSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  quantity: z.number().min(0, 'Quantidade deve ser maior ou igual a 0'),
  price: z.number().min(0.01, 'Preço deve ser maior que 0'),
  supplier: z.string().optional(),
});

type ItemForm = z.infer<typeof itemSchema>;

interface NovoItemDialogProps {
  open: boolean;
  onClose: () => void;
}

function NovoItemDialog({ open, onClose }: NovoItemDialogProps) {
  const { addEstoqueItem } = useDataStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      description: '',
      quantity: 0,
      price: 0,
      supplier: ''
    }
  });

  const onSubmit = (data: ItemForm) => {
    addEstoqueItem({
      name: data.name,
      description: data.description || '',
      quantity: data.quantity,
      price: data.price,
      cost: data.price * 0.7, // Custo como 70% do preço
      supplier: data.supplier || '',
    });
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Item de Estoque</DialogTitle>
          <DialogDescription>
            Adicione um novo item ao estoque
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Item</Label>
            <Input
              id="name"
              placeholder="Ex: Diamantes Kwai Premium"
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Descrição do item"
              {...register('description')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade Inicial</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                {...register('quantity', { valueAsNumber: true })}
                className={errors.quantity ? 'border-red-500' : ''}
              />
              {errors.quantity && (
                <p className="text-sm text-red-500">{errors.quantity.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Preço Unitário (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.01"
                {...register('price', { valueAsNumber: true })}
                className={errors.price ? 'border-red-500' : ''}
              />
              {errors.price && (
                <p className="text-sm text-red-500">{errors.price.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Fornecedor</Label>
            <Input
              id="supplier"
              placeholder="Nome do fornecedor"
              {...register('supplier')}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              Adicionar Item
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Estoque() {
  const { estoque, updateEstoqueItem, addMovimentacao } = useDataStore();
  const { user } = useAuthStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingQuantity, setEditingQuantity] = useState<number>(0);

  const isMaster = user?.role === 'admin';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const startEditing = (itemId: string, currentQuantity: number) => {
    setEditingItem(itemId);
    setEditingQuantity(currentQuantity);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditingQuantity(0);
  };

  const saveQuantity = (itemId: string, itemName: string, originalQuantity: number) => {
    if (editingQuantity === originalQuantity) {
      cancelEditing();
      return;
    }

    updateEstoqueItem(itemId, { quantity: editingQuantity });

    // Registrar movimentação
    const difference = editingQuantity - originalQuantity;
    const movementType = difference > 0 ? 'entrada' : difference < 0 ? 'saida' : 'ajuste';
    const reason = `Ajuste manual pelo usuário ${user?.name || 'Sistema'}`;

    addMovimentacao({
      type: movementType,
      itemId,
      itemName,
      quantity: Math.abs(difference),
      reason,
      userId: user?.id || 'system'
    });

    cancelEditing();
  };

  const filteredItems = estoque.items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = estoque.items.length;
  const totalValue = estoque.items.reduce((sum: number, item) => sum + (item.quantity * item.price), 0);
  const lowStockItems = estoque.items.filter(item => item.quantity < 10).length;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Estoque</h1>
          <p className="text-slate-600 mt-1">
            Gerencie o estoque de diamantes e produtos
          </p>
        </div>

        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo Item
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
            <CardTitle className="text-sm font-medium">Total de Itens</CardTitle>
            <Package className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-slate-600">Tipos diferentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estoque.currentStock || 0}</div>
            <p className="text-xs text-slate-600">Unidades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-slate-600">Em estoque</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockItems}</div>
            <p className="text-xs text-slate-600">Itens com pouco estoque</p>
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
            placeholder="Buscar itens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Itens em Estoque</CardTitle>
            <CardDescription>
              Lista de todos os itens disponíveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Preço Unit.</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead>Status</TableHead>
                    {isMaster && <TableHead>Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isMaster ? 8 : 7} className="text-center py-8 text-slate-500">
                        Nenhum item encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600">{item.description || '-'}</span>
                        </TableCell>
                        <TableCell>
                          {editingItem === item.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                value={editingQuantity}
                                onChange={(e) => setEditingQuantity(Number(e.target.value))}
                                className="w-20"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => saveQuantity(item.id, item.name, item.quantity)}
                                className="p-1"
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                                className="p-1"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.quantity}</span>
                              {isMaster && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditing(item.id, item.quantity)}
                                  className="p-1 opacity-50 hover:opacity-100"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{formatCurrency(item.price)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{formatCurrency(item.quantity * item.price)}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600">{item.supplier || '-'}</span>
                        </TableCell>
                        <TableCell>
                          {item.quantity < 10 ? (
                            <Badge variant="destructive">Estoque Baixo</Badge>
                          ) : item.quantity < 50 ? (
                            <Badge className="bg-yellow-500">Atenção</Badge>
                          ) : (
                            <Badge className="bg-green-600">Disponível</Badge>
                          )}
                        </TableCell>
                        {isMaster && (
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditing(item.id, item.quantity)}
                                className="gap-1"
                              >
                                <Edit2 className="h-3 w-3" />
                                Editar Qtd
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <NovoItemDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
