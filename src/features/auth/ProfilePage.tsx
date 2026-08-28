import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/auth/store';
import { perfilApi } from '@/shared/api/perfil';
import { authApi } from '@/shared/api/auth';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Card, CardBody, CardHeader } from '@/shared/components/ui/Card';
import { FullPageSpinner } from '@/shared/components/ui/Spinner';
import { toastError, useToast } from '@/shared/components/ui/Toast';
import { BrandLogo } from '@/shared/components/BrandLogo';
import { ArrowLeft } from 'lucide-react';

const profileSchema = z.object({
  nombrePerfil: z.string().min(1, 'Requerido').max(80),
  apellidoPerfil: z.string().min(1, 'Requerido').max(80),
  celularPerfil: z.string().regex(/^[+]?[0-9 ()-]{7,25}$/, 'Teléfono inválido'),
  fotoPerfil: z
    .string()
    .url('Debe ser una URL válida')
    .or(z.literal(''))
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const profile = useAuthStore((s) => s.profile);
  const logout = useAuthStore((s) => s.logout);
  const { toast } = useToast();
  const navigate = useNavigate();

  // `/perfil/:id` se indexa por idPerfil, no por idUser: pedir el perfil propio
  // por su endpoint dedicado evita el 404 que dejaba el formulario en blanco y
  // hacía que "Guardar" intentara crear un perfil que ya existía.
  const perfilQuery = useQuery({
    queryKey: ['perfil', 'me'],
    queryFn: perfilApi.getMine,
    enabled: Boolean(profile),
  });

  const { register, handleSubmit, reset, formState } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { nombrePerfil: '', apellidoPerfil: '', celularPerfil: '', fotoPerfil: '' },
  });

  useEffect(() => {
    if (perfilQuery.data) {
      reset({
        nombrePerfil: perfilQuery.data.nombrePerfil,
        apellidoPerfil: perfilQuery.data.apellidoPerfil,
        celularPerfil: perfilQuery.data.celularPerfil,
        fotoPerfil: perfilQuery.data.fotoPerfil ?? '',
      });
    }
  }, [perfilQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: ProfileFormValues) => {
      const payload = { ...values, fotoPerfil: values.fotoPerfil || undefined };
      return perfilQuery.data
        ? perfilApi.update(perfilQuery.data.idPerfil, payload)
        : perfilApi.create(payload);
    },
    onSuccess: () => {
      toast({ tone: 'success', title: 'Perfil guardado' });
      void perfilQuery.refetch();
    },
    onError: (e) => toast(toastError(e)),
  });

  if (perfilQuery.isPending) return <FullPageSpinner />;

  const hasPerfil = Boolean(perfilQuery.data);

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link to="/admin" className="inline-flex items-center gap-2">
            <BrandLogo />
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="size-4" aria-hidden /> Volver
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 p-4">
        <Card>
          <CardHeader
            title="Mi perfil"
            description={
              hasPerfil
                ? `Sesión iniciada como ${profile?.correo ?? ''}`
                : 'Todavía no completaste tu perfil. Cargá tus datos para terminar.'
            }
          />
          <CardBody>
            <form
              onSubmit={handleSubmit((v) => saveMutation.mutate(v))}
              className="grid gap-4 sm:grid-cols-2"
              noValidate
            >
              <Input label="Nombre" error={formState.errors.nombrePerfil?.message} {...register('nombrePerfil')} />
              <Input label="Apellido" error={formState.errors.apellidoPerfil?.message} {...register('apellidoPerfil')} />
              <Input label="Celular" error={formState.errors.celularPerfil?.message} {...register('celularPerfil')} />
              <Input
                label="Foto (URL)"
                hint="Opcional: enlace http(s) a tu foto"
                error={formState.errors.fotoPerfil?.message}
                {...register('fotoPerfil')}
              />
              <div className="sm:col-span-2">
                <Button type="submit" loading={saveMutation.isPending}>
                  {hasPerfil ? 'Guardar perfil' : 'Crear perfil'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <ChangePasswordCard />
      </main>

      <footer className="mx-auto max-w-3xl px-4 pb-8">
        <Button variant="outline" onClick={() => void logout().then(() => navigate('/login'))}>
          Cerrar sesión
        </Button>
      </footer>
    </div>
  );
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8),
    confirmacion: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmacion, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmacion'],
  });

function ChangePasswordCard() {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(passwordSchema) });

  const mutation = useMutation({
    mutationFn: (v: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(v.currentPassword, v.newPassword),
    onSuccess: () => {
      toast({ tone: 'success', title: 'Contraseña actualizada', description: 'Se cerraron tus otras sesiones.' });
      reset();
    },
    onError: (e) => toast(toastError(e)),
  });

  return (
    <Card>
      <CardHeader title="Cambiar contraseña" description="Cierra todas tus sesiones activas" />
      <CardBody>
        <form
          onSubmit={handleSubmit((v) =>
            mutation.mutate({ currentPassword: v.currentPassword, newPassword: v.newPassword }),
          )}
          className="space-y-4"
          noValidate
        >
          <Input
            label="Contraseña actual"
            type="password"
            autoComplete="current-password"
            error={errors.currentPassword?.message as string | undefined}
            {...register('currentPassword')}
          />
          <Input
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            error={errors.newPassword?.message as string | undefined}
            {...register('newPassword')}
          />
          <Input
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            error={errors.confirmacion?.message as string | undefined}
            {...register('confirmacion')}
          />
          <Button type="submit" loading={mutation.isPending}>
            Actualizar contraseña
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
