import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { authApi } from '@/shared/api/auth';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { toastError, useToast } from '@/shared/components/ui/Toast';
import { AuthLayout } from './LoginPage';

const schema = z.object({
  email: z.string().email('Ingresa un correo válido'),
});

type FormValues = z.infer<typeof schema>;

export function ResetRequestPage() {
  const { toast } = useToast();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await authApi.requestPasswordReset(values.email);
      setSent(true);
    } catch (e) {
      toast(toastError(e));
    }
  });

  return (
    <AuthLayout title="Recuperar contraseña" subtitle="Te enviaremos un enlace de recuperación">
      {sent ? (
        <div className="text-center">
          <p className="text-sm text-stone-600">
            Si el correo existe, recibirás instrucciones para restablecer tu contraseña.
          </p>
          <Link to="/login" className="mt-4 inline-block font-medium text-brand-700 hover:underline">
            Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Input
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
            Enviar enlace
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
