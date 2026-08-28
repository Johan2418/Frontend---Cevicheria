import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './shared/auth/store';
import { RequireAuth, RequirePermission } from './routes/guards';
import { PERMISSIONS } from './shared/lib/permissions';

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
          <Route
            path="jornada"
            element={
              <RequirePermission
                anyOf={[PERMISSIONS.BUSINESS_DAY_OPEN, PERMISSIONS.BUSINESS_DAY_CLOSE, PERMISSIONS.INVENTORY_READ]}
              >
                <BusinessDayPage />
              </RequirePermission>
            }
          />
          <Route
            path="inventario"
            element={
              <RequirePermission code={PERMISSIONS.INVENTORY_READ}>
                <InventoryPage />
              </RequirePermission>
            }
          />
          <Route
            path="catalogo"
            element={
              <RequirePermission
                anyOf={[PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_MANAGE, PERMISSIONS.CATEGORY_MANAGE]}
              >
                <CatalogPage />
              </RequirePermission>
            }
          />
          <Route
            path="mesas"
            element={
              <RequirePermission anyOf={[PERMISSIONS.TABLE_READ, PERMISSIONS.TABLE_MANAGE]}>
                <TablesPage />
              </RequirePermission>
            }
          />
          <Route
            path="cocina"
            element={
              <RequirePermission
                anyOf={[PERMISSIONS.ORDER_READ_OPERATIONAL, PERMISSIONS.ORDER_TRANSITION]}
              >
                <KitchenPage />
              </RequirePermission>
            }
          />
          <Route
            path="pagos"
            element={
              <RequirePermission code={PERMISSIONS.PAYMENT_VERIFY}>
                <PaymentsPage />
              </RequirePermission>
            }
          />
          <Route
            path="caja"
            element={
              <RequirePermission
                anyOf={[PERMISSIONS.CASH_READ, PERMISSIONS.CASH_OPEN, PERMISSIONS.CASH_CLOSE]}
              >
                <CashPage />
              </RequirePermission>
            }
          />
          <Route
            path="reportes"
            element={
              <RequirePermission code={PERMISSIONS.REPORT_READ}>
                <ReportsPage />
              </RequirePermission>
            }
          />
          <Route
            path="auditoria"
            element={
              <RequirePermission code={PERMISSIONS.AUDIT_READ}>
                <AuditPage />
              </RequirePermission>
            }
          />
          <Route
            path="roles"
            element={
              <RequirePermission code={PERMISSIONS.ROLE_MANAGE}>
                <RolesPage />
              </RequirePermission>
            }
          />
        </Route>

        <Route path="/perfil" element={<RequireAuth><ProfilePage /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/mesa" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
