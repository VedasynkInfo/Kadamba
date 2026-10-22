import type { OrderTimeline } from '@/services/orders/orderService';

interface OrderTimelineSectionProps {
  timeline: OrderTimeline[];
}

export function OrderTimelineSection({ timeline }: OrderTimelineSectionProps) {
  return (
    <div className="rounded-lg border border-line bg-surface-raised p-6">
      <h3 className="font-heading text-lg text-ink mb-4 border-b border-line pb-2">
        Production timeline
      </h3>
      <div className="relative pl-4 border-l border-line space-y-6 text-xs">
        {timeline.map((event, idx) => (
          <div key={idx} className="relative">
            <span className="on-dark absolute -left-[20px] top-1.5 w-2.5 h-2.5 bg-espresso rounded-full border-2 border-cream" />
            <div className="flex justify-between gap-2 text-[10px] text-ink/70">
              <span className="font-semibold uppercase tracking-wider text-ink/60">
                {event.status.replace('_', ' ')}
              </span>
              <span>
                {new Date(event.at).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                })}
              </span>
            </div>
            {event.note && <p className="text-ink/85 mt-1">{event.note}</p>}
            <span className="text-[9px] text-ink/70 block mt-0.5">By {event.actorId}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
