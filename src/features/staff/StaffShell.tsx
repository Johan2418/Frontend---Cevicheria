import { useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarClock,
  UtensilsCrossed,
  Package,
  BookOpen,
  Table2,
  CreditCard,
  Banknote,
  BarChart3,
  ScrollText,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  UserCircle,
} from 'lucide-react';
import { useAuthStore } from '@/shared/auth/store';
import { PERMISSIONS, type PermissionCode } from '@/shared/lib/permissions';
import { BrandLogo } from '@/shared/components/BrandLogo';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { cn } from '@/shared/lib/cn';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  permissions?: PermissionCode[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/admin', label: 'Panel', icon: <LayoutDashboard className="size-5" aria-hidden /> },
  {
    to: '/admin/jornada',
    label: 'Jornada',
    icon: <CalendarClock className="size-5" aria-hidden />,
    permissions: [PERMISSIONS.BUSINESS_DAY_OPEN, PERMISSIONS.BUSINESS_DAY_CLOSE],
  },
  {
    to: '/admin/cocina',
    label: 'Cocina',
    icon: <UtensilsCrossed className="size-5" aria-hidden />,
    permissions: [PERMISSIONS.ORDER_READ_OPERATIONAL, PERMISSIONS.ORDER_TRANSITION],
  },
  {
    to: '/admin/inventario',
    label: 'Inventario',
    icon: <Package className="size-5" aria-hidden />,
    permissions: [PERMISSIONS.INVENTORY_READ],
  },
  {
    to: '/admin/catalogo',
    label: 'Catálogo',
    icon: <BookOpen className="size-5" aria-hidden />,
    permissions: [PERMISSIONS.PRODUCT_READ, PERMISSIONS.PRODUCT_MANAGE, PERMISSIONS.CATEGORY_MANAGE],
  },
  {
    to: '/admin/mesas',
    label: 'Mesas',
    icon: <Table2 className="size-5" aria-hidden />,
    permissions: [PERMISSIONS.TABLE_READ, PERMISSIONS.TABLE_MANAGE],
  },
  {
    to: '/admin/pagos',
    label: 'Pagos',
    icon: <CreditCard className="size-5" aria-hidden />,
    permissions: [PERMISSIONS.PAYMENT_VERIFY],
  },
  {
    to: '/admin/caja',
    label: 'Caja',
    icon: <Banknote className="size-5" aria-hidden />,
    permissions: [PERMISSIONS.CASH_READ, PERMISSIONS.CASH_OPEN, PERMISSIONS.CASH_CLOSE],
  },
  {
    to: '/admin/reportes',
    label: 'Reportes',
    icon: <BarChart3 className="size-5" aria-hidden />,
    permissions: [PERMISSIONS.REPORT_READ],
  },
  {
    to: '/admin/auditoria',
    label: 'Auditoría',
    icon: <ScrollText className="size-5" aria-hidden />,
    permissions: [PERMISSIONS.AUDIT_READ],
  },
  {
    to: '/admin/roles',
    label: 'Roles',
    icon: <ShieldCheck className="size-5" aria-hidden />,
    permissions: [PERMISSIONS.ROLE_MANAGE],
  },
];

export function StaffShell() {
  const profile = useAuthStore((s) => s.profile);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.permissions || item.permissions.some((p) => hasPermission(p)),
  );

  const logoutBlock = (
    <div className="border-t border-white/10 p-3">
      <button
        onClick={() => void logout().then(() => navigate('/login'))}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-100 hover:bg-white/5 hover:text-white"
      >
        <LogOut className="size-5" aria-hidden />
        Cerrar sesión
      </button>
    </div>
  );

  const sidebar = (
    <nav aria-label="Secciones" className="flex flex-1 flex-col gap-1 p-3">
      {visibleItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/admin'}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-white/10 text-white'
                : 'text-brand-100 hover:bg-white/5 hover:text-white',
            )
          }
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-stone-100">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-brand-900 lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link to="/admin">
            <BrandLogo light />
          </Link>
        </div>
        {sidebar}
        {logoutBlock}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-stone-900/50"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-brand-900">
            <div className="flex h-16 items-center justify-between px-5">
              <BrandLogo light />
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1 text-white hover:bg-white/10"
                aria-label="Cerrar menú"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            {sidebar}
            {logoutBlock}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-stone-200 bg-white px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 lg:hidden"
              aria-label="Abrir menú"
            >
              <Menu className="size-5" aria-hidden />
            </button>
            <span className="text-sm text-stone-500 lg:hidden">CholosBar</span>
          </div>
          <Link
            to="/perfil"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-stone-700 hover:bg-stone-100"
          >
            <UserCircle className="size-6 text-stone-400" aria-hidden />
            <span className="hidden sm:inline">{profile?.correo ?? ''}</span>
          </Link>
        </header>

        <main className="p-4 sm:p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
