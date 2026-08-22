import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/auth/store';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { toastError, useToast } from '@/shared/components/ui/Toast';
import { AuthLayout } from './LoginPage';

const schema = z
  .object({
    correo: z.string().email('Ingresa un correo válido'),
    contrasenia: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmacion: z.string(),
  })
  .refine((v) => v.contrasenia === v.confirmacion, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmacion'],
  });

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const register = useAuthStore((s) => s.register);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await register(values.correo, values.contrasenia);
      toast({ tone: 'success', title: 'Cuenta creada', description: 'Ya puedes iniciar sesión.' });
      navigate('/login');
    } catch (e) {
      setServerError(toastError(e).description ?? 'No se pudo crear la cuenta');
    }
  });

  return (
    <AuthLayout title="Crear cuenta" subtitle="Registrate para usar tu perfil personal">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          error={errors.correo?.message}
          {...field('correo')}
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.contrasenia?.message}
          {...field('contrasenia')}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.confirmacion?.message}
          {...field('confirmacion')}
        />
        {serverError && (
          <p className="text-sm text-red-600" role="alert">
            {serverError}
          </p>
        )}
        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Crear cuenta
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-medium text-brand-700 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
