import type { ReactNode } from 'react';
import { BrandLogo } from '@/shared/components/BrandLogo';

/**
 * Shared frame for the sign-in, register and password-reset screens.
 * Lives in its own file so those lazily-loaded pages do not have to pull in
 * LoginPage's chunk just to borrow its layout.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <BrandLogo light />
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-bold text-stone-900">{title}</h1>
          <p className="mt-1 mb-6 text-sm text-stone-500">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
