import { memo } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons';
import { cn } from '@/utils/cn';
import type { OrderStatus } from '@/shared/enums';
import type { Order } from '@/services/orders/orderService';

export interface OrderBoardColumnProps {
  status: OrderStatus;
  label: string;
  dotClass: string;
  orders: Order[];
}

/**
 * One stage of the pipeline.
 *
 * The column is a drop target and the cards are draggable; dnd-kit's
 * `useDraggable` gives each card a transform while it is held, so the card
 * follows the pointer without the board re-rendering on every move.
 */
export const OrderBoardColumn = memo(function OrderBoardColumn({
  status,
  label,
  dotClass,
  orders,
}: OrderBoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section
      ref={setNodeRef}
      aria-label={label}
      className={cn(
        'flex w-72 shrink-0 flex-col rounded-xl border bg-surface-sunken transition-colors',
        isOver ? 'border-brand/60 bg-brand/[0.06]' : 'border-line',
      )}
    >
      <header className="flex items-center gap-2 border-b border-line px-3 py-2.5">
        <span className={cn('size-2 shrink-0 rounded-full', dotClass)} aria-hidden />
        <h2 className="flex-1 truncate text-xs font-semibold uppercase tracking-wider text-ink/70">
          {label}
        </h2>
        <span className="rounded bg-current/10 px-1.5 py-0.5 text-[0.65rem] font-semibold text-ink/60">
          {orders.length}
        </span>
      </header>

      <div className="flex min-h-24 flex-col gap-2 p-2">
        {orders.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-ink/70">Nothing here</p>
        ) : (
          orders.map((order) => <OrderBoardCard key={order.id} order={order} />)
        )}
      </div>
    </section>
  );
});

function OrderBoardCardBase({ order }: { order: Order }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    data: { order },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const due = order.expectedDeliveryAt
    ? new Date(order.expectedDeliveryAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
      })
    : null;

  return (
    <Link
      to={`/admin/orders/${order.id}`}
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'block cursor-grab rounded-lg border border-line bg-surface-raised p-3 shadow-xs transition-shadow active:cursor-grabbing',
        isDragging ? 'opacity-40' : 'hover:shadow-md',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-brand-strong">
          #{order.orderNumber}
        </p>
        {order.priority === 'rush' ? (
          <span className="inline-flex items-center gap-1 rounded bg-rose-500/15 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-rose-700">
            <Icon name="rush" size={10} />
            Rush
          </span>
        ) : order.priority === 'high' ? (
          <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-amber-400">
            High
          </span>
        ) : null}
      </div>

      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-snug text-ink-raised">
        {order.title}
      </p>
      <p className="mt-1 truncate text-xs text-ink/70">{order.customerId?.name}</p>

      {due ? (
        <p className="mt-2 inline-flex items-center gap-1 text-[0.65rem] text-ink/70">
          <Icon name="calendar" size={11} />
          Due {due}
        </p>
      ) : null}
    </Link>
  );
}

/**
 * Cards are memoised on the order object. A drag only changes which column is
 * hovered, and an optimistic move replaces one order object — the other forty
 * cards have nothing new to draw.
 */
const OrderBoardCard = memo(OrderBoardCardBase);
