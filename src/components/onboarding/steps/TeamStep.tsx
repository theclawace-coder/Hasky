import { useState } from 'react';
import { Users, Plus, X, ArrowRight, ChevronLeft, Send, Loader2 } from 'lucide-react';
import { notify } from '../../../lib/notify';
import { inviteTeamMember } from '../../../services/api';

interface Invite {
  email: string;
  role: 'admin' | 'user' | 'viewer';
}

interface Props {
  onNext: (invitesSent: number) => void;
  onBack: () => void;
}

const ROLES = [
  { value: 'admin' as const, label: 'Admin', desc: 'Full access' },
  { value: 'user' as const, label: 'User', desc: 'Standard' },
  { value: 'viewer' as const, label: 'Viewer', desc: 'Read-only' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const glassInput =
  'w-full rounded-xl border border-slate-200/80 bg-white/60 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 backdrop-blur-sm transition-all focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20';

const cardStyle = {
  background: 'rgba(255,255,255,0.78)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.70)',
  boxShadow: '0 8px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
};

export function TeamStep({ onNext, onBack }: Props) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Invite['role']>('user');
  const [sending, setSending] = useState(false);

  const handleAdd = () => {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      notify.error('Enter a valid email address');
      return;
    }
    if (invites.some((i) => i.email === trimmed)) {
      notify.error('Already in the list');
      return;
    }
    setInvites((prev) => [...prev, { email: trimmed, role }]);
    setEmail('');
  };

  const handleSend = async () => {
    if (invites.length === 0) {
      onNext(0);
      return;
    }
    setSending(true);
    let sent = 0;
    for (const inv of invites) {
      try {
        await inviteTeamMember(inv);
        sent++;
      } catch {
        // continue with remaining invites
      }
    }
    if (sent > 0) {
      notify.sent(`${sent} invite${sent !== 1 ? 's' : ''} sent!`);
    } else {
      notify.error('Invites could not be sent — try again from Settings → Team');
    }
    setSending(false);
    onNext(sent);
  };

  const avatarLetter = (e: string) => e.charAt(0).toUpperCase();

  const roleActiveStyle = {
    admin: { background: 'linear-gradient(135deg, #7c3aed, #a855f7)' },
    user: { background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)' },
    viewer: { background: 'linear-gradient(135deg, #64748b, #94a3b8)' },
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-24">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.20)' }}
          >
            <Users className="size-7 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Bring your team</h2>
          <p className="mt-2 text-sm text-slate-500">
            Invite colleagues — or skip and do this later from Settings
          </p>
        </div>

        <div className="rounded-3xl p-8" style={cardStyle}>
          {/* Invited list */}
          {invites.length > 0 && (
            <div className="mb-6 space-y-2">
              {invites.map((inv, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-violet-100 text-xs font-bold text-blue-700">
                    {avatarLetter(inv.email)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm text-slate-800">{inv.email}</div>
                    <div className="text-xs capitalize text-slate-400">{inv.role}</div>
                  </div>
                  <button
                    onClick={() => setInvites((prev) => prev.filter((_, j) => j !== i))}
                    className="shrink-0 text-slate-300 transition-colors hover:text-slate-500"
                    aria-label="Remove invite"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add form */}
          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com.au"
              className={glassInput}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />

            {/* Role selector */}
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={[
                    'rounded-xl px-3 py-2.5 text-xs transition-all duration-150',
                    role === r.value
                      ? 'text-white font-semibold shadow-[0_0_10px_rgba(124,58,237,0.20)]'
                      : 'border border-slate-200/80 bg-white/60 text-slate-500 hover:bg-white/90 hover:text-slate-700',
                  ].join(' ')}
                  style={role === r.value ? roleActiveStyle[r.value] : undefined}
                >
                  <div className="font-medium">{r.label}</div>
                  <div className={role === r.value ? 'text-white/70' : 'text-slate-400'}>
                    {r.desc}
                  </div>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm text-slate-400 transition-all hover:border-violet-300 hover:text-violet-600"
            >
              <Plus className="size-4" />
              Add to list
            </button>
          </div>

          {invites.length === 0 && (
            <p className="mt-4 text-center text-xs text-slate-400">
              You can invite team members at any time from Settings → Team
            </p>
          )}

          {/* Actions */}
          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-600"
            >
              <ChevronLeft className="size-4" />
              Back
            </button>

            <div className="flex items-center gap-3">
              {invites.length === 0 && (
                <button
                  onClick={() => onNext(0)}
                  className="text-sm text-slate-400 transition-colors hover:text-slate-600"
                >
                  Skip
                </button>
              )}
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center gap-2 rounded-2xl px-7 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.97] disabled:opacity-70"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
                  boxShadow: '0 0 16px rgba(124,58,237,0.28)',
                }}
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {invites.length > 0
                  ? `Send ${invites.length} invite${invites.length !== 1 ? 's' : ''}`
                  : 'Continue'}
                {!sending && <ArrowRight className="size-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
