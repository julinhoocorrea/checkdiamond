import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Revendedores } from '@/pages/Revendedores';
import { Vendas } from '@/pages/Vendas';
import { Envios } from '@/pages/Envios';
import { Pagamentos } from '@/pages/Pagamentos';
import { VendaCliente } from '@/pages/VendaCliente';
import { Estoque } from '@/pages/Estoque';
import { Configuracoes } from '@/pages/Configuracoes';
import { IAAna } from '@/pages/IAAna';
import { Relatorios } from '@/pages/Relatorios';
import { useAuthStore } from '@/stores/auth';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="revendedores" element={<Revendedores />} />
          <Route path="vendas" element={<Vendas />} />
          <Route path="envios" element={
            <ProtectedRoute requireRole="admin">
              <Envios />
            </ProtectedRoute>
          } />
          <Route path="pagamentos" element={
            <ProtectedRoute requireRole="admin">
              <Pagamentos />
            </ProtectedRoute>
          } />
          <Route path="estoque" element={<Estoque />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="ia" element={<IAAna />} />
          <Route path="relatorios" element={<Relatorios />} />
        </Route>

        {/* Rota pública para vendas de clientes */}
        <Route path="/venda" element={<VendaCliente />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
