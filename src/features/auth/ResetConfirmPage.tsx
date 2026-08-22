import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/shared/api/auth';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { toastError, useToast } from '@/shared/components/ui/Toast';
import { AuthLayout } from './LoginPage';

const schema = z
  .object({
    token: z.string().min(40, 'Token inválido'),
    newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmacion: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmacion, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmacion'],
  });

type FormValues = z.infer<typeof schema>;

export function ResetConfirmPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await authApi.confirmPasswordReset(values.token, values.newPassword);
      toast({ tone: 'success', title: 'Contraseña restablecida' });
      navigate('/login');
    } catch (e) {
      setServerError(toastError(e).description ?? 'No se pudo restablecer la contraseña');
    }
  });

  return (
    <AuthLayout title="Nueva contraseña" subtitle="Ingresa el token recibido y tu nueva contraseña">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input label="Token de recuperación" error={errors.token?.message} {...register('token')} />
        <Input
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.confirmacion?.message}
          {...register('confirmacion')}
        />
        {serverError && (
          <p className="text-sm text-red-600" role="alert">
            {serverError}
          </p>
        )}
        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Restablecer
        </Button>
      </form>
    </AuthLayout>
  );
}
