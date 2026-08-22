import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, ShieldCheck, KeyRound } from 'lucide-react';
import { rolesApi, type CreateRolDto, type UpdateRolDto } from '@/shared/api/roles';
import type { Rol } from '@/shared/types/api';
import { PERMISSIONS, PERMISSION_LABELS, type PermissionCode } from '@/shared/lib/permissions';
import { Card, CardBody } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { Badge } from '@/shared/components/ui/Badge';
import { FullPageSpinner } from '@/shared/components/ui/Spinner';
import { toastError, useToast } from '@/shared/components/ui/Toast';

const ALL_PERMISSIONS = Object.values(PERMISSIONS) as PermissionCode[];

const roleSchema = z.object({
  codigoRol: z.string().min(2).max(50).regex(/^[A-Z][A-Z0-9_]*$/, 'Formato: MAYUSCULA_MAYUSCULA'),
  nombreRol: z.string().min(1).max(100),
  descripcionRol: z.string().min(1).max(255),
});

export function RolesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Rol | null>(null);
  const [permissionsFor, setPermissionsFor] = useState<Rol | null>(null);
  const [deleting, setDeleting] = useState<Rol | null>(null);

  const rolesQuery = useQuery({ queryKey: ['rols'], queryFn: rolesApi.list });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => rolesApi.remove(id),
    onSuccess: () => {
      toast({ tone: 'success', title: 'Rol eliminado' });
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: ['rols'] });
    },
    onError: (e) => toast(toastError(e)),
  });

  if (rolesQuery.isPending) return <FullPageSpinner />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Roles</h1>
          <p className="text-sm text-stone-500">Roles del sistema y sus permisos</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" aria-hidden /> Nuevo rol
        </Button>
      </div>

      <Card>
        <CardBody>
          <ul className="divide-y divide-stone-100">
            {(rolesQuery.data ?? []).map((rol) => (
              <li key={rol.idRol} className="flex items-center gap-3 py-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <ShieldCheck className="size-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-stone-900">{rol.nombreRol}</p>
                    {rol.isSystem && <Badge tone="brand">Sistema</Badge>}
                  </div>
                  <p className="text-xs text-stone-500">
                    {rol.codigoRol} · {rol.permissions?.length ?? 0} permisos
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setPermissionsFor(rol)}>
                  <KeyRound className="size-4" aria-hidden /> Permisos
                </Button>
                {!rol.isSystem && (
                  <>
                    <button
                      onClick={() => setEditing(rol)}
                      className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                      aria-label={`Editar ${rol.nombreRol}`}
                    >
                      <Pencil className="size-4" aria-hidden />
                    </button>
                    <button
                      onClick={() => setDeleting(rol)}
                      className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Eliminar ${rol.nombreRol}`}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {creating && <RoleFormModal onClose={() => setCreating(false)} />}
      {editing && <RoleFormModal role={editing} onClose={() => setEditing(null)} />}
      {permissionsFor && <PermissionsModal role={permissionsFor} onClose={() => setPermissionsFor(null)} />}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting.idRol);
        }}
        title="Eliminar rol"
        description={`¿Eliminar el rol "${deleting?.nombreRol}"? No se puede eliminar si tiene usuarios.`}
        confirmLabel="Eliminar"
      />
    </div>
  );
}

function RoleFormModal({ role, onClose }: { role?: Rol; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: role
      ? { codigoRol: role.codigoRol, nombreRol: role.nombreRol, descripcionRol: role.descripcionRol }
      : { codigoRol: '', nombreRol: '', descripcionRol: '' },
  });

  const mutation = useMutation({
    mutationFn: (v: z.infer<typeof roleSchema>) =>
      role
        ? rolesApi.update(role.idRol, v as UpdateRolDto)
        : rolesApi.create(v as CreateRolDto),
    onSuccess: () => {
      toast({ tone: 'success', title: role ? 'Rol actualizado' : 'Rol creado' });
      onClose();
      void queryClient.invalidateQueries({ queryKey: ['rols'] });
    },
    onError: (e) => toast(toastError(e)),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={role ? 'Editar rol' : 'Nuevo rol'}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={form.handleSubmit((v) => mutation.mutate(v))} loading={mutation.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate>
        <Input label="Código" hint="Ej: SUPERVISOR" error={form.formState.errors.codigoRol?.message} {...form.register('codigoRol')} />
        <Input label="Nombre" error={form.formState.errors.nombreRol?.message} {...form.register('nombreRol')} />
        <Textarea label="Descripción" rows={2} error={form.formState.errors.descripcionRol?.message} {...form.register('descripcionRol')} />
      </form>
    </Modal>
  );
}

function PermissionsModal({ role, onClose }: { role: Rol; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set((role.permissions ?? []).map((p) => p.codigoPermiso)),
  );

  const mutation = useMutation({
    mutationFn: (permissionCodes: string[]) => rolesApi.replacePermissions(role.idRol, permissionCodes),
    onSuccess: () => {
      toast({ tone: 'success', title: 'Permisos actualizados' });
      onClose();
      void queryClient.invalidateQueries({ queryKey: ['rols'] });
    },
    onError: (e) => toast(toastError(e)),
  });

  function toggle(code: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Permisos de ${role.nombreRol}`}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => mutation.mutate([...selected])} loading={mutation.isPending}>
            Guardar permisos
          </Button>
        </>
      }
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {ALL_PERMISSIONS.map((code) => (
          <label
            key={code}
            className="flex items-start gap-2 rounded-lg border border-stone-200 p-2.5 text-sm hover:bg-stone-50"
          >
            <input
              type="checkbox"
              className="mt-0.5 size-4 rounded border-stone-300 accent-brand-700"
              checked={selected.has(code)}
              onChange={() => toggle(code)}
            />
            <span>
              <span className="block font-medium text-stone-800">{PERMISSION_LABELS[code]}</span>
              <span className="block text-xs text-stone-400">{code}</span>
            </span>
          </label>
        ))}
      </div>
    </Modal>
  );
}
