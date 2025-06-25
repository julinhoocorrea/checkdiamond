import type React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Diamond,
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Truck,
  CreditCard,
  Bot,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  path: string;
  isActive: boolean;
}

function SidebarItem({ icon: Icon, label, path, isActive }: SidebarItemProps) {
  return (
    <Link to={path}>
      <motion.div
        whileHover={{ x: 2 }}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <Icon className="h-5 w-5" />
        <span className="font-medium">{label}</span>
      </motion.div>
    </Link>
  );
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Revendedores', path: '/revendedores' },
    { icon: ShoppingCart, label: 'Vendas', path: '/vendas' },
    { icon: Package, label: 'Estoque', path: '/estoque' },
    { icon: Truck, label: 'Envios', path: '/envios' },
    { icon: CreditCard, label: 'Pagamentos', path: '/pagamentos' },
    { icon: Settings, label: 'Configurações PIX', path: '/configuracoes' },
    { icon: Bot, label: 'IA Ana', path: '/ia' },
    { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 p-6 border-b">
          <Diamond className="h-8 w-8 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800">Kwai Diamonds</h1>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden ml-auto"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => (
            <SidebarItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              isActive={location.pathname === item.path}
            />
          ))}
        </nav>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b px-6 py-4 md:hidden">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Diamond className="h-6 w-6 text-blue-600" />
              <span className="font-semibold text-slate-800">Kwai Diamonds</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
