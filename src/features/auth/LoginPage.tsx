import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/auth/store';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { toastError } from '@/shared/components/ui/Toast';
import { useToast } from '@/shared/components/ui/Toast';
import { AuthLayout } from './AuthLayout';

const schema = z.object({
  correo: z.string().email('Ingresa un correo válido'),
  contrasenia: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values.correo, values.contrasenia);
      toast({ tone: 'success', title: 'Bienvenido' });
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
      navigate(from ?? '/admin', { replace: true });
    } catch (e) {
      setServerError(toastError(e).description ?? 'No se pudo iniciar sesión');
    }
  });

  return (
    <AuthLayout title="Iniciar sesión" subtitle="Accedé al panel de operación">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="tucorreo@ejemplo.com"
          error={errors.correo?.message}
          {...register('correo')}
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          error={errors.contrasenia?.message}
          {...register('contrasenia')}
        />
        <div className="flex justify-end">
          <Link to="/recuperar" className="text-sm font-medium text-brand-700 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        {serverError && (
          <p className="text-sm text-red-600" role="alert">
            {serverError}
          </p>
        )}
        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Ingresar
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="font-medium text-brand-700 hover:underline">
          Regístrate
        </Link>
      </p>
    </AuthLayout>
  );
}
