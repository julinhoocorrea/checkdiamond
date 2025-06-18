import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Gem, Users, Wallet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { useDataStore } from '@/stores/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  trend?: number;
  delay?: number;
}

function MetricCard({ title, value, description, icon: Icon, trend, delay = 0 }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <span>{description}</span>
            {trend !== undefined && (
              <span className={`flex items-center ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className="h-3 w-3 mr-1" />
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function Dashboard() {
  const { getDashboardMetrics, getChartData } = useDataStore();
  const metrics = getDashboardMetrics();
  const chartData = getChartData();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('pt-BR').format(value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600">
          Visão geral das métricas de hoje - {new Date().toLocaleDateString('pt-BR')}
        </p>
      </motion.div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          title="Receita Bruta"
          value={formatCurrency(metrics.receitaBruta)}
          description="Vendas do dia"
          icon={DollarSign}
          trend={12.5}
          delay={0.1}
        />
        <MetricCard
          title="Lucro Líquido"
          value={formatCurrency(metrics.lucroLiquido)}
          description="Após impostos e comissões"
          icon={TrendingUp}
          trend={8.2}
          delay={0.2}
        />
        <MetricCard
          title="Total de Vendas"
          value={formatNumber(metrics.totalVendas)}
          description="Vendas realizadas"
          icon={Gem}
          trend={5.1}
          delay={0.3}
        />
        <MetricCard
          title="Revendedores Ativos"
          value={formatNumber(metrics.revendedoresAtivos)}
          description="Total ativo"
          icon={Users}
          trend={-2.1}
          delay={0.4}
        />
        <MetricCard
          title="Lucro Líquido"
          value={formatCurrency(metrics.lucroLiquido)}
          description="Líquido total"
          icon={Wallet}
          delay={0.5}
        />
      </div>

      {/* Chart Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-slate-900">Últimos 7 Dias</CardTitle>
            <CardDescription>
              Evolução de receita, lucro e comissões
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                  <XAxis
                    dataKey="date"
                    className="text-slate-500"
                    fontSize={12}
                  />
                  <YAxis
                    className="text-slate-500"
                    fontSize={12}
                    tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
                            <p className="font-medium text-slate-900">{label}</p>
                            {payload.map((entry) => (
                              <p key={entry.dataKey} style={{ color: entry.color }}>
                                <span className="font-medium">{entry.name}:</span>{' '}
                                {formatCurrency(entry.value as number)}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="receita"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    name="Receita"
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lucro"
                    stroke="#10b981"
                    strokeWidth={3}
                    name="Lucro"
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="comissao"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    name="Comissão"
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-900">Adicionar Venda</CardTitle>
            <CardDescription>Registrar nova venda manualmente</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Cadastre vendas de diamantes e calcule automaticamente lucros e comissões
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-900">Novo Revendedor</CardTitle>
            <CardDescription>Cadastrar novo parceiro</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Adicione novos revendedores e configure suas comissões
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-slate-900">Gerar Relatório</CardTitle>
            <CardDescription>DRE do período</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              Exporte relatórios financeiros completos em PDF
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
