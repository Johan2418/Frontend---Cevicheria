import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './shared/auth/store';
import { RequireAuth } from './routes/guards';

import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { ResetRequestPage } from './features/auth/ResetRequestPage';
import { ResetConfirmPage } from './features/auth/ResetConfirmPage';
import { ProfilePage } from './features/auth/ProfilePage';

import { CustomerShell } from './features/customer/CustomerShell';
import { TableLandingPage } from './features/customer/TableLandingPage';
import { MenuPage } from './features/customer/MenuPage';
import { CheckoutPage } from './features/customer/CheckoutPage';
import { MyOrdersPage } from './features/customer/MyOrdersPage';

import { StaffShell } from './features/staff/StaffShell';
import { DashboardPage } from './features/staff/DashboardPage';
import { BusinessDayPage } from './features/staff/business-day/BusinessDayPage';
import { InventoryPage } from './features/staff/inventory/InventoryPage';
import { CatalogPage } from './features/staff/catalog/CatalogPage';
import { TablesPage } from './features/staff/tables/TablesPage';
import { KitchenPage } from './features/staff/kitchen/KitchenPage';
import { PaymentsPage } from './features/staff/payments/PaymentsPage';
import { CashPage } from './features/staff/cash/CashPage';
import { ReportsPage } from './features/staff/reports/ReportsPage';
import { AuditPage } from './features/staff/audit/AuditPage';
import { RolesPage } from './features/staff/roles/RolesPage';

function Bootstrap() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <Bootstrap />
      <Routes>
        <Route path="/" element={<Navigate to="/mesa" replace />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/recuperar" element={<ResetRequestPage />} />
        <Route path="/recuperar/confirmar" element={<ResetConfirmPage />} />

        <Route path="/mesa" element={<CustomerShell />}>
          <Route index element={<TableLandingPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="ordenes" element={<MyOrdersPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireAuth>
              <StaffShell />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="jornada" element={<BusinessDayPage />} />
          <Route path="inventario" element={<InventoryPage />} />
          <Route path="catalogo" element={<CatalogPage />} />
          <Route path="mesas" element={<TablesPage />} />
          <Route path="cocina" element={<KitchenPage />} />
          <Route path="pagos" element={<PaymentsPage />} />
          <Route path="caja" element={<CashPage />} />
          <Route path="reportes" element={<ReportsPage />} />
          <Route path="auditoria" element={<AuditPage />} />
          <Route path="roles" element={<RolesPage />} />
        </Route>

        <Route path="/perfil" element={<RequireAuth><ProfilePage /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/mesa" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
