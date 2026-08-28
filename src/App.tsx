import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from './shared/auth/store';
import { RedirectIfAuthenticated, RequireAuth, RequirePermission } from './routes/guards';
import { PERMISSIONS } from './shared/lib/permissions';
import { FullPageSpinner } from './shared/components/ui/Spinner';

import { CustomerShell } from './features/customer/CustomerShell';
import { TableLandingPage } from './features/customer/TableLandingPage';
import { MenuPage } from './features/customer/MenuPage';
import { CheckoutPage } from './features/customer/CheckoutPage';
import { MyOrdersPage } from './features/customer/MyOrdersPage';
import { RequireTableSession } from './features/customer/RequireTableSession';
import { NotFoundPage } from './features/NotFoundPage';

import { LoginPage } from './features/auth/LoginPage';

/**
 * Everything below is split out of the initial bundle. A diner scanning the QR
 * on mobile data should not download the staff console or the auth screens to
 * see the menu.
 */
const RegisterPage = lazy(() => import('./features/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ResetRequestPage = lazy(() => import('./features/auth/ResetRequestPage').then((m) => ({ default: m.ResetRequestPage })));
const ResetConfirmPage = lazy(() => import('./features/auth/ResetConfirmPage').then((m) => ({ default: m.ResetConfirmPage })));
const ProfilePage = lazy(() => import('./features/auth/ProfilePage').then((m) => ({ default: m.ProfilePage })));

const StaffShell = lazy(() => import('./features/staff/StaffShell').then((m) => ({ default: m.StaffShell })));
const DashboardPage = lazy(() => import('./features/staff/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const BusinessDayPage = lazy(() => import('./features/staff/business-day/BusinessDayPage').then((m) => ({ default: m.BusinessDayPage })));
const InventoryPage = lazy(() => import('./features/staff/inventory/InventoryPage').then((m) => ({ default: m.InventoryPage })));
const CatalogPage = lazy(() => import('./features/staff/catalog/CatalogPage').then((m) => ({ default: m.CatalogPage })));
const TablesPage = lazy(() => import('./features/staff/tables/TablesPage').then((m) => ({ default: m.TablesPage })));
const KitchenPage = lazy(() => import('./features/staff/kitchen/KitchenPage').then((m) => ({ default: m.KitchenPage })));
const PaymentsPage = lazy(() => import('./features/staff/payments/PaymentsPage').then((m) => ({ default: m.PaymentsPage })));
const CashPage = lazy(() => import('./features/staff/cash/CashPage').then((m) => ({ default: m.CashPage })));
const ReportsPage = lazy(() => import('./features/staff/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const AuditPage = lazy(() => import('./features/staff/audit/AuditPage').then((m) => ({ default: m.AuditPage })));
const RolesPage = lazy(() => import('./features/staff/roles/RolesPage').then((m) => ({ default: m.RolesPage })));

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
      <Suspense fallback={<FullPageSpinner />}>
        <Routes>
          <Route path="/" element={<Navigate to="/mesa" replace />} />

          {/* A signed-in user has no business on the auth screens. */}
          <Route element={<RedirectIfAuthenticated />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/recuperar" element={<ResetRequestPage />} />
            <Route path="/recuperar/confirmar" element={<ResetConfirmPage />} />
          </Route>

          <Route path="/mesa" element={<CustomerShell />}>
            <Route index element={<TableLandingPage />} />
            {/* One guard for every screen that needs a live table session. */}
            <Route element={<RequireTableSession />}>
              <Route path="menu" element={<MenuPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="ordenes" element={<MyOrdersPage />} />
            </Route>
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

            {/* Permissions mirror the staff nav, so a hidden link and a typed
                URL reach the same verdict. */}
            <Route
              path="jornada"
              element={
                <RequirePermission
                  anyOf={[PERMISSIONS.BUSINESS_DAY_OPEN, PERMISSIONS.BUSINESS_DAY_CLOSE]}
                >
                  <BusinessDayPage />
                </RequirePermission>
              }
            />
            <Route
              path="inventario"
              element={
                <RequirePermission anyOf={[PERMISSIONS.INVENTORY_READ]}>
                  <InventoryPage />
                </RequirePermission>
              }
            />
            <Route
              path="catalogo"
              element={
                <RequirePermission
                  anyOf={[
                    PERMISSIONS.PRODUCT_READ,
                    PERMISSIONS.PRODUCT_MANAGE,
                    PERMISSIONS.CATEGORY_MANAGE,
                  ]}
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
                <RequirePermission anyOf={[PERMISSIONS.PAYMENT_VERIFY]}>
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
                <RequirePermission anyOf={[PERMISSIONS.REPORT_READ]}>
                  <ReportsPage />
                </RequirePermission>
              }
            />
            <Route
              path="auditoria"
              element={
                <RequirePermission anyOf={[PERMISSIONS.AUDIT_READ]}>
                  <AuditPage />
                </RequirePermission>
              }
            />
            <Route
              path="roles"
              element={
                <RequirePermission anyOf={[PERMISSIONS.ROLE_MANAGE]}>
                  <RolesPage />
                </RequirePermission>
              }
            />
          </Route>

          <Route
            path="/perfil"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
