import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Button, Spinner, useToast } from '@/components/ui';
import { usePortalChatSocket } from '@/hooks/usePortalChatSocket';
import { portalApi, type PortalMessage } from '@/services/portal/portalService';
import { cn } from '@/utils/cn';

export default function PortalChatPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const onSocketMessage = useCallback((msg: PortalMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  const { connected } = usePortalChatSocket(onSocketMessage);

  async function refresh() {
    const data = await portalApi.chat();
    setMessages(data);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load chat');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    const text = body.trim();
    setBody('');
    try {
      const sent = await portalApi.sendChat({ body: text });
      setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
    } catch (err) {
      setBody(text);
      toast({
        tone: 'error',
        title: 'Send failed',
        description: err instanceof Error ? err.message : 'Try again',
      });
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner label="Loading chat" />
      </div>
    );
  }

  if (error) return <p className="text-rose-300">{error}</p>;

  return (
    <div className="flex h-[min(72vh,38rem)] flex-col">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl text-cream">Chat with boutique</h1>
          <p className="mt-2 text-sm text-cream/55">Ask about fittings, fabric, or delivery.</p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-2 rounded-sm border px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.16em]',
            connected
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-100',
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              connected ? 'bg-emerald-400' : 'bg-amber-300',
            )}
          />
          {connected ? 'Live' : 'Reconnecting…'}
        </span>
      </div>

      <div className="mt-6 flex-1 space-y-3 overflow-y-auto border border-gold/15 bg-black/25 p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-cream/45">No messages yet — say hello.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'max-w-[85%] rounded-sm px-3 py-2 text-sm',
                m.senderRole === 'customer'
                  ? 'ml-auto bg-gold/20 text-cream'
                  : 'mr-auto bg-white/5 text-cream/90',
              )}
            >
              <p className="text-[0.6rem] uppercase tracking-[0.16em] text-cream/40">
                {m.senderRole === 'customer' ? 'You' : 'Boutique'}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
              {m.createdAt ? (
                <p className="mt-1 text-[0.65rem] text-cream/35">
                  {new Date(m.createdAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              ) : null}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSend} className="mt-4 flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          className="flex-1 rounded-sm border border-gold/25 bg-black/40 px-3 py-2.5 text-sm text-cream outline-none focus:border-gold"
          maxLength={4000}
        />
        <Button type="submit" disabled={sending || !body.trim()}>
          {sending ? '…' : 'Send'}
        </Button>
      </form>
    </div>
  );
}
