import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Login } from '@/pages/Login';
import { POS } from '@/pages/POS';
import { Kitchen } from '@/pages/Kitchen';
import { Tables } from '@/pages/Tables';
import { Orders } from '@/pages/Orders';
import { MenuManagement } from '@/pages/MenuManagement';
import { Reports } from '@/pages/Reports';
import { Settings } from '@/pages/Settings';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<POS />} />
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute roles={['admin', 'manager', 'kitchen']}>
              <Kitchen />
            </ProtectedRoute>
          }
        />
        <Route path="/tables" element={<Tables />} />
        <Route path="/orders" element={<Orders />} />
        <Route
          path="/menu-management"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <MenuManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute roles={['admin']}>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
