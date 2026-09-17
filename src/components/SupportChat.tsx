import { useEffect, useMemo, useRef, useState } from 'react';
import { LoaderCircle, MessageCircle, Paperclip, Send, X } from 'lucide-react';
import { getSupportMessages, sendSupportMessage, startSupportConversation } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { SupportMessage } from '../lib/types';

function messageLabel(senderType: string): string {
  if (senderType === 'admin') return 'Support team';
  if (senderType === 'system') return 'System';
  return 'You';
}

export function SupportChat() {
  const { user, openAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [body, setBody] = useState('');
  const [attachment, setAttachment] = useState<File | undefined>();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const storageKey = useMemo(() => `yangon-tv-support-token:${user?.id ?? user?.email ?? 'guest'}`, [user]);

  useEffect(() => {
    if (!user) {
      setToken(null);
      setMessages([]);
      return;
    }
    setToken(window.localStorage.getItem(storageKey));
  }, [storageKey, user]);

  async function refreshConversation(existingToken = token) {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      let activeToken = existingToken;
      if (!activeToken) {
        const started = await startSupportConversation(undefined, window.location.href);
        activeToken = started.conversation.token || started.conversation.public_token || null;
        if (!activeToken) throw new Error('Support conversation token was missing.');
        window.localStorage.setItem(storageKey, activeToken);
        setToken(activeToken);
        setMessages(started.messages || []);
      } else {
        const next = await getSupportMessages(activeToken, 0);
        setMessages(next.messages || []);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load support chat.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open || !user) return;
    void refreshConversation();
    const timer = window.setInterval(() => {
      if (token) void getSupportMessages(token, 0).then((next) => setMessages(next.messages || [])).catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [open, user, token]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function send() {
    if (!user) {
      openAuth('login');
      return;
    }
    if ((!body.trim() && !attachment) || sending) return;
    setSending(true);
    setError(null);
    try {
      let activeToken = token;
      if (!activeToken) {
        const started = await startSupportConversation(undefined, window.location.href);
        activeToken = started.conversation.token || started.conversation.public_token || null;
        if (!activeToken) throw new Error('Support conversation token was missing.');
        window.localStorage.setItem(storageKey, activeToken);
        setToken(activeToken);
        setMessages(started.messages || []);
      }
      const sent = await sendSupportMessage(activeToken, body, attachment);
      setMessages((current) => current.some((item) => item.id === sent.id) ? current : [...current, sent]);
      setBody('');
      setAttachment(undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to send support message.');
    } finally {
      setSending(false);
    }
  }

  return <div className="support-chat">
    {open && <section className="support-chat__panel" aria-label="Customer support chat">
      <header className="support-chat__header">
        <div className="support-chat__brand"><img src="/yangon-tv-logo.jpg" alt="Yangon TV" /><strong>customer care</strong></div>
        <div className="support-chat__header-actions">
          <button type="button" aria-label="Close support chat" onClick={() => setOpen(false)}><X size={23} /></button>
        </div>
      </header>
      <div className="support-chat__messages" aria-live="polite">
        {loading && !messages.length ? <div className="support-chat__empty"><LoaderCircle className="spin" size={18} /> Loading conversation…</div> : messages.length ? messages.map((message) => <article className={`support-chat__message support-chat__message--${message.sender_type}`} key={message.id}>
          {message.sender_type !== 'visitor' && <img className="support-chat__avatar" src="/yangon-tv-logo.jpg" alt="Yangon TV support" />}
          <div className="support-chat__message-body">
            {message.sender_type !== 'visitor' && <span className="support-chat__sender">{messageLabel(message.sender_type)}</span>}
            {message.body && <p>{message.body}</p>}
            {message.attachment_url && <a href={message.attachment_url} target="_blank" rel="noreferrer">{message.attachment_name || 'View attachment'}</a>}
            {message.sender_type === 'visitor' ? <time>Read</time> : <time>{message.created_at ? new Date(message.created_at).toLocaleString() : ''}</time>}
          </div>
        </article>) : <div className="support-chat__empty">How can we help with your subscription?</div>}
        <div ref={endRef} />
      </div>
      {error && <p className="support-chat__error" role="alert">{error}</p>}
      {attachment && <div className="support-chat__attachment"><Paperclip size={14} />{attachment.name}<button type="button" onClick={() => setAttachment(undefined)} aria-label="Remove attachment"><X size={13} /></button></div>}
      <div className="support-chat__composer"><label className="support-chat__attach" aria-label="Attach image"><Paperclip size={17} /><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setAttachment(event.target.files?.[0])} /></label><input value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="Write a message..." aria-label="Message" /><button type="button" aria-label="Send message" onClick={() => void send()} disabled={sending || (!body.trim() && !attachment)}>{sending ? <LoaderCircle className="spin" size={17} /> : <Send size={23} />}</button></div>
    </section>}
    {!open && <button className="support-chat__launcher" type="button" aria-label="Open customer support" aria-expanded={false} onClick={() => { if (!user) openAuth('login'); else setOpen(true); }}><MessageCircle size={22} /></button>}
  </div>;
}

export default SupportChat;
