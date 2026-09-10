import { FormEvent, useEffect, useState } from 'react';
import { ImagePlus, MessageCircle, Send, X } from 'lucide-react';
import { api } from '../lib/api';

type ChatMessage = { id: string | number; body: string; sender?: 'user' | 'support'; created_at?: string };

export function Modal({ open, title, description, children, onClose }: { open: boolean; title: string; description?: string; children: React.ReactNode; onClose: () => void }) {
  if (!open) return null;
  return <div className="ui-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="ui-modal" role="dialog" aria-modal="true" aria-labelledby="ui-modal-title"><button className="ui-modal__close" type="button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button><span className="eyebrow">Yangon TV</span><h2 id="ui-modal-title">{title}</h2>{description && <p>{description}</p>}{children}</section></div>;
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    api.get('/support/conversations').then((response) => {
      const data = response.data?.data ?? response.data;
      const conversation = Array.isArray(data) ? data[0] : data?.conversation ?? data;
      const nextToken = conversation?.token ?? conversation?.access_token;
      if (active && nextToken) { setToken(String(nextToken)); setMessages(Array.isArray(conversation.messages) ? conversation.messages : []); }
    }).catch(() => undefined).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      let activeToken = token;
      if (!activeToken) {
        const started = await api.post('/support/start', { subject: 'Subscription help' });
        const data = started.data?.data ?? started.data;
        activeToken = String(data?.token ?? data?.conversation?.token ?? '');
        setToken(activeToken || null);
      }
      if (!activeToken) throw new Error('Unable to start support chat');
      const response = await api.post(`/support/${activeToken}/messages`, { body, message: body });
      const data = response.data?.data ?? response.data;
      const message = data?.message ?? data;
      if (message?.id) setMessages((current) => [...current, { id: message.id, body: message.body ?? body, sender: 'user', created_at: message.created_at }]);
      setDraft('');
    } catch {
      // Keep the composer quiet; the modal remains usable for retry.
    } finally { setSending(false); }
  }

  return <>
    <button className="support-launcher" type="button" onClick={() => setOpen(true)} aria-label="Open customer support"><MessageCircle size={22} /></button>
    {open && <div className="support-chat-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><section className="support-chat" role="dialog" aria-modal="true" aria-labelledby="support-chat-title"><header className="support-chat__header"><div><span className="eyebrow">Subscription help</span><h2 id="support-chat-title">Yangon TV Support</h2><p><i /> Usually replies shortly</p></div><button className="support-chat__close" type="button" onClick={() => setOpen(false)} aria-label="Close support chat"><X size={22} /></button></header><div className="support-chat__messages" aria-live="polite">{loading ? <p className="support-chat__empty">Loading conversation…</p> : messages.length ? messages.map((message) => <article className={message.sender === 'user' ? 'support-message support-message--user' : 'support-message'} key={message.id}><small>{message.sender === 'user' ? 'You' : 'Support'}</small><p>{message.body}</p></article>) : <p className="support-chat__empty">How can we help with your subscription?</p>}</div><form className="support-chat__composer" onSubmit={send}><button className="support-chat__attach" type="button" aria-label="Attach image"><ImagePlus size={21} /></button><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write a message…" aria-label="Message" maxLength={2000} /><button className="support-chat__send" type="submit" disabled={sending || !draft.trim()} aria-label="Send message"><Send size={20} /></button></form></section></div>}
  </>;
}

export function ConfirmModal({ open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm, onCancel }: { open: boolean; title: string; description: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  return <Modal open={open} title={title} description={description} onClose={onCancel}><div className="ui-modal__actions"><button className="button button--outline" type="button" onClick={onCancel}>{cancelLabel}</button><button className={danger ? 'button button--danger' : 'button button--primary'} type="button" onClick={onConfirm}>{confirmLabel}</button></div></Modal>;
}

export function BackConfirmModal({ open, onStay, onLeave }: { open: boolean; onStay: () => void; onLeave: () => void }) {
  return <ConfirmModal open={open} title="Leave this page?" description="Your unsaved changes will be lost if you go back." confirmLabel="Leave page" cancelLabel="Stay" onConfirm={onLeave} onCancel={onStay} />;
}
