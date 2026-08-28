import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { catalogApi } from '@/shared/api/catalog';
import { ordersApi, type CreateManualOrderDto } from '@/shared/api/orders';
import { tablesApi } from '@/shared/api/tables';
import { newIdempotencyKey } from '@/shared/lib/idempotency';
import { formatMoney } from '@/shared/lib/money';
import { Button } from '@/shared/components/ui/Button';
import { Modal } from '@/shared/components/ui/Modal';
import { Select } from '@/shared/components/ui/Select';
import { Input } from '@/shared/components/ui/Input';
import { toastError, useToast } from '@/shared/components/ui/Toast';
import { queryKeys } from '@/shared/api/queryKeys';

interface DraftItem {
  productId: string;
  quantity: number;
  observation?: string;
}

export function ManualOrderModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tableId, setTableId] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const productsQuery = useQuery({ queryKey: queryKeys.products.all, queryFn: () => catalogApi.listProducts({ active: true, limit: 100 }) });
  const tablesQuery = useQuery({ queryKey: queryKeys.tables.all, queryFn: tablesApi.listTables });

  const mutation = useMutation({
    mutationFn: (dto: CreateManualOrderDto) => ordersApi.createManualOrder(dto, newIdempotencyKey()),
    onSuccess: () => {
      toast({ tone: 'success', title: 'Pedido creado' });
      onClose();
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
    onError: (e) => toast(toastError(e)),
  });

  const products = productsQuery.data ?? [];

  function addItem() {
    if (!productId || quantity < 1) return;
    const product = products.find((p) => p.idProduct === productId);
    if (!product) return;
    setItems((prev) => [...prev, { productId, quantity }]);
    setProductId('');
    setQuantity(1);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function submit() {
    if (items.length === 0) return;
    const dto: CreateManualOrderDto = {
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, observation: i.observation })),
      tableId: tableId || undefined,
    };
    mutation.mutate(dto);
  }

  const total = items.reduce((sum, i) => {
    const p = products.find((pp) => pp.idProduct === i.productId);
    return sum + (p?.priceCents ?? 0) * i.quantity;
  }, 0);

  return (
    <Modal
      open
      onClose={onClose}
      title="Nuevo pedido manual"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={items.length === 0} loading={mutation.isPending}>
            Crear pedido
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Select label="Mesa (opcional)" placeholder="Sin mesa" value={tableId} onChange={(e) => setTableId(e.target.value)}>
          <option value="">Sin mesa</option>
          {(tablesQuery.data ?? []).map((t) => (
            <option key={t.idTable} value={t.idTable}>Mesa {t.code}</option>
          ))}
        </Select>

        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Select label="Producto" placeholder="Seleccioná" value={productId} onChange={(e) => setProductId(e.target.value)}>
              {products.map((p) => (
                <option key={p.idProduct} value={p.idProduct}>{p.name}</option>
              ))}
            </Select>
          </div>
          <div className="w-24">
            <Input label="Cant." type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </div>
          <Button onClick={addItem} disabled={!productId}>
            <Plus className="size-4" aria-hidden />
          </Button>
        </div>

        <ul className="divide-y divide-stone-100">
          {items.map((item, index) => {
            const product = products.find((p) => p.idProduct === item.productId);
            return (
              <li key={`${item.productId}-${index}`} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-stone-900">
                    {item.quantity} × {product?.name ?? item.productId}
                  </p>
                  {product && (
                    <p className="text-sm text-stone-500">{formatMoney(product.priceCents * item.quantity)}</p>
                  )}
                </div>
                <button
                  onClick={() => removeItem(index)}
                  className="rounded p-1.5 text-stone-400 hover:text-red-600"
                  aria-label="Quitar ítem"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>

        {items.length > 0 && (
          <div className="flex items-center justify-between border-t border-stone-100 pt-3">
            <span className="text-stone-600">Total</span>
            <span className="font-bold text-stone-900">{formatMoney(total)}</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
