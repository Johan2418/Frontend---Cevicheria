import { useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2, BookOpen, Package } from 'lucide-react';
import { useAuthStore } from '@/shared/auth/store';
import { PERMISSIONS } from '@/shared/lib/permissions';
import { catalogApi, type CreateProductDto, type UpdateProductDto } from '@/shared/api/catalog';
import type { Category, Product } from '@/shared/types/api';
import { formatMoney } from '@/shared/lib/money';
import { Card, CardBody, CardHeader } from '@/shared/components/ui/Card';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Select } from '@/shared/components/ui/Select';
import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { Badge } from '@/shared/components/ui/Badge';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { FullPageSpinner } from '@/shared/components/ui/Spinner';
import { toastError, useToast } from '@/shared/components/ui/Toast';
import { cn } from '@/shared/lib/cn';

export function CatalogPage() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [tab, setTab] = useState<'products' | 'categories'>('products');

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Catálogo</h1>
          <p className="text-sm text-stone-500">Productos y categorías del menú</p>
        </div>
        <div className="flex rounded-lg border border-stone-200 bg-white p-1">
          <TabButton active={tab === 'products'} onClick={() => setTab('products')}>
            Productos
          </TabButton>
          <TabButton active={tab === 'categories'} onClick={() => setTab('categories')}>
            Categorías
          </TabButton>
        </div>
      </div>

      {tab === 'products' ? (
        hasPermission(PERMISSIONS.PRODUCT_READ) ? (
          <ProductsSection />
        ) : (
          <p className="text-sm text-stone-500">No tenés permiso para ver productos.</p>
        )
      ) : hasPermission(PERMISSIONS.CATEGORY_MANAGE) ? (
        <CategoriesSection />
      ) : (
        <p className="text-sm text-stone-500">No tenés permiso para gestionar categorías.</p>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={cn(
        'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-brand-700 text-white' : 'text-stone-600 hover:bg-stone-100',
      )}
    >
      {children}
    </button>
  );
}

/* ---------------- Products ---------------- */

const productSchema = z.object({
  sku: z.string().min(2, 'Mínimo 2 caracteres').max(64).regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, 'Formato inválido'),
  name: z.string().min(2, 'Mínimo 2 caracteres').max(150),
  description: z.string().max(1000).optional(),
  price: z.string().min(1, 'Requerido'),
  imageUrl: z.string().url('URL inválida').or(z.literal('')).optional(),
  categoryId: z.string().min(1, 'Seleccioná una categoría'),
  displayOrder: z.number().int().min(0).max(10000),
  active: z.boolean(),
  visibleInMenu: z.boolean(),
  trackInventory: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

function ProductsSection() {
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  const productsQuery = useQuery({
    queryKey: ['products', { limit: 100 }],
    queryFn: () => catalogApi.listProducts({ limit: 100 }),
  });
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: catalogApi.listCategories });

  if (productsQuery.isPending || categoriesQuery.isPending) return <FullPageSpinner />;

  const canManage = hasPermission(PERMISSIONS.PRODUCT_MANAGE);

  return (
    <Card>
      <CardHeader
        title="Productos"
        action={
          canManage && (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="size-4" aria-hidden /> Nuevo
            </Button>
          )
        }
      />
      <CardBody>
        {!productsQuery.data || productsQuery.data.length === 0 ? (
          <EmptyState
            icon={<Package className="size-10" aria-hidden />}
            title="Sin productos"
            description="Creá productos para armar tu menú."
          />
        ) : (
          <ul className="divide-y divide-stone-100">
            {productsQuery.data.map((p) => (
              <li key={p.idProduct} className="flex items-center gap-3 py-3">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt="" className="size-12 rounded-lg object-cover" />
                ) : (
                  <div className="flex size-12 items-center justify-center rounded-lg bg-stone-100 text-stone-300">
                    <Package className="size-5" aria-hidden />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-stone-900">{p.name}</p>
                    {!p.active && <Badge tone="neutral">Inactivo</Badge>}
                    {!p.visibleInMenu && <Badge tone="warning">Oculto</Badge>}
                  </div>
                  <p className="text-xs text-stone-500">
                    {p.category?.name ?? 'Sin categoría'} · SKU {p.sku}
                  </p>
                </div>
                <span className="font-semibold text-stone-900">{formatMoney(p.priceCents)}</span>
                {canManage && (
                  <button
                    onClick={() => setEditing(p)}
                    className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                    aria-label={`Editar ${p.name}`}
                  >
                    <Pencil className="size-4" aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardBody>

      {(creating || editing) && (
        <ProductFormModal
          product={editing}
          categories={categoriesQuery.data ?? []}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </Card>
  );
}

function ProductFormModal({
  product,
  categories,
  onClose,
}: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          sku: product.sku,
          name: product.name,
          description: product.description ?? '',
          price: (product.priceCents / 100).toFixed(2),
          imageUrl: product.imageUrl ?? '',
          categoryId: product.categoryId,
          displayOrder: product.displayOrder,
          active: product.active,
          visibleInMenu: product.visibleInMenu,
          trackInventory: product.trackInventory,
        }
      : {
          sku: '',
          name: '',
          description: '',
          price: '',
          imageUrl: '',
          categoryId: '',
          displayOrder: 0,
          active: true,
          visibleInMenu: true,
          trackInventory: true,
        },
  });

  const mutation = useMutation({
    mutationFn: (values: ProductFormValues) => {
      const priceCents = Math.round(Number.parseFloat(values.price) * 100);
      const payload: CreateProductDto = {
        sku: values.sku,
        name: values.name,
        description: values.description || undefined,
        priceCents,
        imageUrl: values.imageUrl || undefined,
        categoryId: values.categoryId,
        displayOrder: values.displayOrder,
        active: values.active,
        visibleInMenu: values.visibleInMenu,
        trackInventory: values.trackInventory,
      };
      return product
        ? catalogApi.updateProduct(product.idProduct, payload as UpdateProductDto)
        : catalogApi.createProduct(payload);
    },
    onSuccess: () => {
      toast({ tone: 'success', title: product ? 'Producto actualizado' : 'Producto creado' });
      onClose();
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
    onError: (e) => toast(toastError(e)),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={product ? 'Editar producto' : 'Nuevo producto'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={form.handleSubmit((v) => mutation.mutate(v))} loading={mutation.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit((v) => mutation.mutate(v))} noValidate>
        <Input label="Nombre" error={form.formState.errors.name?.message} {...form.register('name')} />
        <Input label="SKU" error={form.formState.errors.sku?.message} {...form.register('sku')} />
        <Input label="Precio (USD)" type="number" step="0.01" min="0" error={form.formState.errors.price?.message} {...form.register('price')} />
        <Select label="Categoría" placeholder="Seleccioná" error={form.formState.errors.categoryId?.message} {...form.register('categoryId')}>
          {categories.map((c) => (
            <option key={c.idCategory} value={c.idCategory}>{c.name}</option>
          ))}
        </Select>
        <div className="sm:col-span-2">
          <Textarea label="Descripción" rows={2} error={form.formState.errors.description?.message} {...form.register('description')} />
        </div>
        <div className="sm:col-span-2">
          <Input label="Imagen (URL)" error={form.formState.errors.imageUrl?.message} {...form.register('imageUrl')} />
        </div>
        <Input label="Orden de visualización" type="number" min={0} error={form.formState.errors.displayOrder?.message} {...form.register('displayOrder', { valueAsNumber: true })} />
        <div className="flex flex-col gap-2 pt-1">
          <FormCheckbox control={form.control} name="active" label="Activo" />
          <FormCheckbox control={form.control} name="visibleInMenu" label="Visible en menú" />
          <FormCheckbox control={form.control} name="trackInventory" label="Controla inventario" />
        </div>
      </form>
    </Modal>
  );
}

/* ---------------- Categories ---------------- */

const categorySchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  description: z.string().max(255).optional(),
  displayOrder: z.number().int().min(0).max(10000),
  active: z.boolean(),
});

function CategoriesSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: catalogApi.listCategories });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => catalogApi.deleteCategory(id),
    onSuccess: () => {
      toast({ tone: 'success', title: 'Categoría eliminada' });
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (e) => toast(toastError(e)),
  });

  if (categoriesQuery.isPending) return <FullPageSpinner />;

  return (
    <Card>
      <CardHeader
        title="Categorías"
        action={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden /> Nueva
          </Button>
        }
      />
      <CardBody>
        {!categoriesQuery.data || categoriesQuery.data.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="size-10" aria-hidden />}
            title="Sin categorías"
            description="Creá categorías para organizar tu menú."
          />
        ) : (
          <ul className="divide-y divide-stone-100">
            {categoriesQuery.data.map((c) => (
              <li key={c.idCategory} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-stone-900">{c.name}</p>
                    {!c.active && <Badge tone="neutral">Inactiva</Badge>}
                  </div>
                  {c.description && <p className="text-xs text-stone-500">{c.description}</p>}
                </div>
                <button
                  onClick={() => setEditing(c)}
                  className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                  aria-label={`Editar ${c.name}`}
                >
                  <Pencil className="size-4" aria-hidden />
                </button>
                <button
                  onClick={() => setDeleting(c)}
                  className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Eliminar ${c.name}`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>

      {(creating || editing) && (
        <CategoryFormModal
          category={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting.idCategory);
        }}
        title="Eliminar categoría"
        description={`¿Seguro que querés eliminar "${deleting?.name}"? No se puede eliminar si tiene productos.`}
        confirmLabel="Eliminar"
      />
    </Card>
  );
}

function CategoryFormModal({ category, onClose }: { category: Category | null; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? {
          name: category.name,
          description: category.description ?? '',
          displayOrder: category.displayOrder,
          active: category.active,
        }
      : { name: '', description: '', displayOrder: 0, active: true },
  });

  const mutation = useMutation({
    mutationFn: (v: z.infer<typeof categorySchema>) =>
      category
        ? catalogApi.updateCategory(category.idCategory, v)
        : catalogApi.createCategory(v),
    onSuccess: () => {
      toast({ tone: 'success', title: category ? 'Categoría actualizada' : 'Categoría creada' });
      onClose();
      void queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (e) => toast(toastError(e)),
  });

  return (
    <Modal
      open
      onClose={onClose}
      title={category ? 'Editar categoría' : 'Nueva categoría'}
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
        <Input label="Nombre" error={form.formState.errors.name?.message} {...form.register('name')} />
        <Textarea label="Descripción" rows={2} error={form.formState.errors.description?.message} {...form.register('description')} />
        <Input label="Orden" type="number" min={0} error={form.formState.errors.displayOrder?.message} {...form.register('displayOrder', { valueAsNumber: true })} />
        <FormCheckbox control={form.control} name="active" label="Activa" />
      </form>
    </Modal>
  );
}

function FormCheckbox<T extends FieldValues>({
  control,
  name,
  label,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            className="size-4 rounded border-stone-300 accent-brand-700"
            checked={Boolean(field.value)}
            onChange={(e) => field.onChange(e.target.checked)}
            onBlur={field.onBlur}
            ref={field.ref}
          />
          {label}
        </label>
      )}
    />
  );
}
