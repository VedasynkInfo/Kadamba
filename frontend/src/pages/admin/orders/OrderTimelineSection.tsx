import type { OrderTimeline } from '@/services/orders/orderService';

interface OrderTimelineSectionProps {
  timeline: OrderTimeline[];
}

export function OrderTimelineSection({ timeline }: OrderTimelineSectionProps) {
  return (
    <div className="rounded-lg border border-black/10 bg-cream p-6">
      <h3 className="font-heading text-lg text-black mb-4 border-b border-black/5 pb-2">
        Production timeline
      </h3>
      <div className="relative pl-4 border-l border-black/10 space-y-6 text-xs">
        {timeline.map((event, idx) => (
          <div key={idx} className="relative">
            <span className="absolute -left-[20px] top-1.5 w-2.5 h-2.5 bg-black rounded-full border-2 border-cream" />
            <div className="flex justify-between gap-2 text-[10px] text-black/45">
              <span className="font-semibold uppercase tracking-wider text-black/60">
                {event.status.replace('_', ' ')}
              </span>
              <span>
                {new Date(event.at).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                })}
              </span>
            </div>
            {event.note && <p className="text-black/85 mt-1">{event.note}</p>}
            <span className="text-[9px] text-black/35 block mt-0.5">By {event.actorId}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
