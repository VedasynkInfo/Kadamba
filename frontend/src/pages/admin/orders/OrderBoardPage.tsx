import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icons';
import { Button, Input, Modal, useToast } from '@/components/ui';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { toAppError } from '@/lib/apiError';
import { qk } from '@/lib/queryKeys';
import { type OrderStatus } from '@/shared/enums';
import { ordersApi, type Order } from '@/services/orders/orderService';
import { OrderBoardColumn } from './OrderBoardColumn';
import { canMoveOrder, ORDER_STATUS_CONFIG, orderStatusLabel, transitionNeedsNote } from './types';

/**
 * The order pipeline, as a board.
 *
 * A boutique's orders move through nine stages, and a list view hides that:
 * the list answers "what is open", the board answers "what is stuck". The
 * stage an order is in is the single most useful thing about it, so the board
 * is the desk's natural shape.
 *
 * Two rules keep the board honest:
 *
 * 1. **The state machine decides what a drag means.** The board reads the same
 *    shared transition map the API enforces, so a card can only be dropped
 *    where the server would accept it. A refusal is explained rather than
 *    silently ignored.
 * 2. **The move is optimistic, and reversible.** The card lands in the new
 *    column immediately — a board that lags behind the server feels broken —
 *    and the cache is rolled back if the write is refused.
 *
 * Every move is a status change, and every status change is written to the
 * audit log by the API, so dragging a card is a recorded act rather than a
 * visual trick.
 */

const BOARD_COLUMNS: OrderStatus[] = [
  'enquiry',
  'confirmed',
  'measurements',
  'cutting',
  'stitching',
  'embroidery_maggam',
  'trial',
  'finishing',
  'delivery',
  'on_hold',
  'cancelled',
];

const BOARD_FILTER = { limit: 100, status: 'All' };

export default function OrderBoardPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dragging, setDragging] = useState<Order | null>(null);
  const [pending, setPending] = useState<{ order: Order; to: OrderStatus } | null>(null);
  const [reason, setReason] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const ordersQuery = useQuery({
    queryKey: qk.orders.board(BOARD_FILTER),
    queryFn: () => ordersApi.list(BOARD_FILTER),
    select: (page) => page.items ?? [],
  });

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);

  const byStatus = useMemo(() => {
    const map = new Map<OrderStatus, Order[]>();
    for (const column of BOARD_COLUMNS) map.set(column, []);
    for (const order of orders) {
      const column = map.has(order.status) ? order.status : 'enquiry';
      map.get(column)?.push(order);
    }
    // Within a column, the nearest delivery comes first: the board is read for
    // "what is due next".
    for (const column of map.values()) {
      column.sort((a, b) => {
        const aDate = a.expectedDeliveryAt ? new Date(a.expectedDeliveryAt).getTime() : Infinity;
        const bDate = b.expectedDeliveryAt ? new Date(b.expectedDeliveryAt).getTime() : Infinity;
        return aDate - bDate;
      });
    }
    return map;
  }, [orders]);

  const transition = useMutation({
    mutationFn: (args: { id: string; status: OrderStatus; note?: string }) =>
      ordersApi.transitionStatus(args.id, args.status, args.note),
    onMutate: async ({ id, status }) => {
      // Move the card now; put it back if the server says no.
      await queryClient.cancelQueries({ queryKey: qk.orders.all });
      const previous = queryClient.getQueryData(qk.orders.board(BOARD_FILTER));
      queryClient.setQueryData(qk.orders.board(BOARD_FILTER), (current) =>
        (current as Order[] | undefined)?.map((order) =>
          order.id === id ? { ...order, status } : order,
        ),
      );
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(qk.orders.board(BOARD_FILTER), context.previous);
      }
      toast({
        title: 'The order did not move',
        description: toAppError(error).message,
        tone: 'error',
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: qk.orders.all });
    },
  });

  function handleDragStart(event: DragStartEvent) {
    setDragging((event.active.data.current?.order as Order | undefined) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragging(null);
    const order = event.active.data.current?.order as Order | undefined;
    const target = event.over?.id as OrderStatus | undefined;
    if (!order || !target || order.status === target) return;

    if (!canMoveOrder(order.status, target)) {      toast({
        title: 'That move is not allowed',
        description: `An order at ${orderStatusLabel(
          order.status,
        )} cannot go straight to ${orderStatusLabel(target)}.`,
        tone: 'error',
      });
      return;
    }

    // Cancelling, pausing, or sending a garment backwards all deserve a
    // reason: the audit trail should say why, not just that.
    if (transitionNeedsNote(order.status, target)) {
      setReason('');
      setPending({ order, to: target });
      return;
    }

    transition.mutate({ id: order.id, status: target });
  }

  function confirmPending() {
    if (!pending) return;
    transition.mutate({
      id: pending.order.id,
      status: pending.to,
      note: reason.trim() || undefined,
    });
    setPending(null);
    setReason('');
  }

  const activeCount = orders.filter(
    (order) => order.status !== 'delivery' && order.status !== 'cancelled',
  ).length;

  return (
    <div className="min-h-screen bg-surface p-4 text-ink sm:p-6">
      <AdminHorizonBanner
        title="Production board"
        copy="Every order, by the stage it is in. Drag a card to move it along the pipeline."
        actionLabel="Back to list"
        actionTo="/admin/orders"
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="rounded-md border border-line bg-surface-raised px-2.5 py-1 text-xs text-ink/60">
          {activeCount} in production
        </span>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
        >
          <Icon name="list" size={14} />
          List view
        </Link>
      </div>

      {ordersQuery.isError ? (
        <div className="rounded-xl border border-line bg-surface-raised p-6 text-sm text-ink/70">
          The board could not be loaded. {toAppError(ordersQuery.error).message}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setDragging(null)}
        >
          <div className="flex gap-3 overflow-x-auto pb-4">
            {BOARD_COLUMNS.map((status) => (
              <OrderBoardColumn
                key={status}
                status={status}
                label={ORDER_STATUS_CONFIG[status]?.label ?? status}
                dotClass={ORDER_STATUS_CONFIG[status]?.dotColor ?? 'bg-stone-400'}
                orders={byStatus.get(status) ?? []}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={null}>
            {dragging ? (
              <div className="w-64 rotate-2 cursor-grabbing rounded-xl border border-brand/40 bg-surface-raised p-3 shadow-2xl">
                <p className="text-[0.65rem] uppercase tracking-wider text-brand">
                  #{dragging.orderNumber}
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold text-ink-raised">
                  {dragging.title}
                </p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        title="Why is this order moving?"
        description="A cancelled, paused or reworked order keeps its reason. The audit log keeps it with the order."
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button variant="admin" onClick={confirmPending}>
              Move the order
            </Button>
          </div>
        }
      >
        <Input
          label="Reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="e.g. the client changed the design"
          autoFocus
        />
      </Modal>
    </div>
  );
}
