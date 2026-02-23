import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, ChevronRight, Copy, ExternalLink } from 'lucide-react';
import { notify } from '../../lib/notify';
import { useAuth } from '../../hooks/useAuth';
import {
  getCompanySettings,
  getProfiles,
  getStripeConfigStatus,
  getTeamInvites,
  inviteTeamMember,
  removeCompanyLogoObject,
  saveStripeConfig,
  uploadCompanyLogo,
  upsertCompanySettings,
  upsertProfile,
} from '../../services/api';
import { supabase } from '../../lib/supabase';
import { AU_STATES } from '../../lib/constants';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { AddressAutocomplete } from '../../components/ui/AddressAutocomplete';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDate } from '../../lib/utils';
import type { Profile, TeamInvite } from '../../types';

const tabs = ['Company Profile', 'Team Members', 'Invoice Settings', 'My Profile'] as const;
type Tab = (typeof tabs)[number];
type TeamRole = Profile['role'];

interface CompanyFormState {
  name: string;
  abn: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
}

interface ProfileFormState {
  full_name: string;
  phone: string;
  password: string;
}

interface SettingsFormState {
  allow_cross_hire: boolean;
  payment_terms_days: number;
  bank_name: string;
  bank_bsb: string;
  bank_account_number: string;
  bank_account_name: string;
  default_invoice_notes: string;
}

interface StripeFormState {
  publishable_key: string;
  secret_key: string;
  webhook_secret: string;
}

export default function Settings() {
  const { user, profile, company, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('Company Profile');
  const companyLogoInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ['company_settings'],
    queryFn: getCompanySettings,
  });

  const teamQuery = useQuery({
    queryKey: ['profiles'],
    queryFn: getProfiles,
  });

  const invitesQuery = useQuery({
    queryKey: ['team_invites'],
    queryFn: getTeamInvites,
  });

  const stripeConfigQuery = useQuery({
    queryKey: ['stripe_config'],
    queryFn: getStripeConfigStatus,
  });

  const companyDefaults = useMemo<CompanyFormState>(
    () => ({
      name: company?.name ?? '',
      abn: company?.abn ?? '',
      phone: company?.phone ?? '',
      email: company?.email ?? '',
      address: company?.address ?? '',
      city: company?.city ?? '',
      state: company?.state ?? 'NSW',
    }),
    [company],
  );
  const [companyFormDraft, setCompanyFormDraft] = useState<CompanyFormState | null>(null);
  const companyForm = companyFormDraft ?? companyDefaults;
  const setCompanyForm = (updater: (state: CompanyFormState) => CompanyFormState) => {
    setCompanyFormDraft((state) => updater(state ?? companyDefaults));
  };

  const profileDefaults = useMemo<ProfileFormState>(
    () => ({
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
      password: '',
    }),
    [profile],
  );
  const [profileFormDraft, setProfileFormDraft] = useState<ProfileFormState | null>(null);
  const profileForm = profileFormDraft ?? profileDefaults;
  const setProfileForm = (updater: (state: ProfileFormState) => ProfileFormState) => {
    setProfileFormDraft((state) => updater(state ?? profileDefaults));
  };

  const settingsDefaults = useMemo<SettingsFormState>(
    () => ({
      allow_cross_hire: true,
      payment_terms_days: settingsQuery.data?.payment_terms_days ?? 14,
      bank_name: settingsQuery.data?.bank_name ?? '',
      bank_bsb: settingsQuery.data?.bank_bsb ?? '',
      bank_account_number: settingsQuery.data?.bank_account_number ?? '',
      bank_account_name: settingsQuery.data?.bank_account_name ?? '',
      default_invoice_notes: settingsQuery.data?.default_invoice_notes ?? '',
    }),
    [settingsQuery.data],
  );
  const [settingsFormDraft, setSettingsFormDraft] = useState<SettingsFormState | null>(null);
  const settingsForm = settingsFormDraft ?? settingsDefaults;
  const setSettingsForm = (updater: (state: SettingsFormState) => SettingsFormState) => {
    setSettingsFormDraft((state) => updater(state ?? settingsDefaults));
  };

  const stripeDefaults = useMemo<StripeFormState>(
    () => ({
      publishable_key: stripeConfigQuery.data?.publishable_key ?? '',
      secret_key: '',
      webhook_secret: '',
    }),
    [stripeConfigQuery.data?.publishable_key],
  );
  const [stripeFormDraft, setStripeFormDraft] = useState<StripeFormState | null>(null);
  const stripeForm = stripeFormDraft ?? stripeDefaults;
  const setStripeForm = (updater: (state: StripeFormState) => StripeFormState) => {
    setStripeFormDraft((state) => updater(state ?? stripeDefaults));
  };

  const [inviteForm, setInviteForm] = useState<{ email: string; role: TeamRole }>({
    email: '',
    role: 'user',
  });

  const [stripeGuideOpen, setStripeGuideOpen] = useState(false);

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook`;

  const stripeFullyConfigured =
    Boolean(stripeConfigQuery.data?.publishable_key) &&
    Boolean(stripeConfigQuery.data?.has_secret_key) &&
    Boolean(stripeConfigQuery.data?.has_webhook_secret);

  const handleCopyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      notify.success('Webhook URL copied');
    } catch {
      notify.error('Failed to copy — please select and copy manually');
    }
  };

  const saveCompanyMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id) {
        throw new Error('Company not found');
      }
      const normalizedName = companyForm.name.trim();
      const normalizedEmail = companyForm.email.trim();
      const normalizedAbn = companyForm.abn.trim();
      if (!normalizedName) {
        throw new Error('Company name is required');
      }
      if (normalizedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        throw new Error('Please enter a valid company email');
      }
      if (normalizedAbn && !/^\d{11}$/.test(normalizedAbn.replace(/\s/g, ''))) {
        throw new Error('ABN must be 11 digits');
      }
      const { error, data } = await supabase.from('companies').update({
        ...companyForm,
        name: normalizedName,
        email: normalizedEmail || null,
        abn: normalizedAbn || null,
      }).eq('id', company.id).select();
      if (error) {
        throw new Error(error.message);
      }
      if (!data || data.length === 0) {
        throw new Error('Save failed — please try signing out and back in');
      }
    },
    onSuccess: async () => {
      await refreshProfile();
      setCompanyFormDraft(null);
      notify.success('Company updated');
    },
    onError: (error) => {
      notify.error(error instanceof Error ? error.message : 'Failed to save company');
    },
  });

  const handleUploadCompanyLogo = async (file: File | null) => {
    if (!file || !company?.id) {
      return;
    }
    setIsUploadingLogo(true);
    try {
      const nextLogoUrl = await uploadCompanyLogo(file, company.id);
      const { error } = await supabase.from('companies').update({ logo_url: nextLogoUrl }).eq('id', company.id);
      if (error) {
        throw new Error(error.message);
      }
      await refreshProfile();
      notify.success('Company logo updated');
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Could not upload logo');
    } finally {
      setIsUploadingLogo(false);
      if (companyLogoInputRef.current) {
        companyLogoInputRef.current.value = '';
      }
    }
  };

  const handleRemoveCompanyLogo = async () => {
    if (!company?.id) {
      return;
    }
    setIsUploadingLogo(true);
    try {
      await removeCompanyLogoObject(company.logo_url);
      const { error } = await supabase.from('companies').update({ logo_url: null }).eq('id', company.id);
      if (error) {
        throw new Error(error.message);
      }
      await refreshProfile();
      notify.success('Company logo removed');
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Could not remove logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id) {
        throw new Error('Company not found');
      }
      await upsertCompanySettings({ company_id: company.id, ...settingsForm });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['company_settings'] });
      setSettingsFormDraft(null);
      notify.success('Settings updated');
    },
    onError: (error) => {
      notify.error(error instanceof Error ? error.message : 'Failed to save settings');
    },
  });

  const saveStripeMutation = useMutation({
    mutationFn: () => {
      const payload: Parameters<typeof saveStripeConfig>[0] = {
        publishable_key: stripeForm.publishable_key,
      };
      if (stripeForm.secret_key.trim()) {
        payload.secret_key = stripeForm.secret_key.trim();
      }
      if (stripeForm.webhook_secret.trim()) {
        payload.webhook_secret = stripeForm.webhook_secret.trim();
      }
      return saveStripeConfig(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['stripe_config'] });
      setStripeFormDraft(null);
      notify.success('Stripe settings updated');
    },
    onError: (error) => {
      notify.error(error instanceof Error ? error.message : 'Failed to update Stripe settings');
    },
  });

  const saveTeamRoleMutation = useMutation({
    mutationFn: ({ id, role, is_active }: { id: string; role: TeamRole; is_active: boolean }) =>
      upsertProfile({ id, role, is_active }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profiles'] });
      notify.success('Team member updated');
    },
  });

  const inviteMutation = useMutation({
    mutationFn: () => {
      const trimmedEmail = inviteForm.email.trim();
      if (!trimmedEmail) throw new Error('Email is required');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        throw new Error('Please enter a valid email address');
      }
      return inviteTeamMember({ ...inviteForm, email: trimmedEmail });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['team_invites'] });
      notify.sent('Invite sent');
      setInviteForm({ email: '', role: 'user' });
    },
    onError: (error) => {
      notify.error(error instanceof Error ? error.message : 'Failed to send invite');
    },
  });

  const saveProfileMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) {
        throw new Error('Profile not found');
      }
      await upsertProfile({ id: profile.id, full_name: profileForm.full_name, phone: profileForm.phone });

      if (profileForm.password) {
        const { error } = await supabase.auth.updateUser({ password: profileForm.password });
        if (error) {
          throw new Error(error.message);
        }
      }
    },
    onSuccess: async () => {
      setProfileForm((state) => ({ ...state, password: '' }));
      await refreshProfile();
      setProfileFormDraft(null);
      notify.success('Profile updated');
    },
    onError: (error) => {
      notify.error(error instanceof Error ? error.message : 'Failed to save profile');
    },
  });

  const teamMembers = useMemo(
    () => (teamQuery.data ?? []).filter((member) => member.company_id === profile?.company_id),
    [teamQuery.data, profile?.company_id],
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-slate-900">Settings</h2>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Button key={item} size="sm" variant={tab === item ? 'primary' : 'secondary'} onClick={() => setTab(item)}>
            {item}
          </Button>
        ))}
      </div>

      {tab === 'Company Profile' ? (
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Company Profile</h3>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-700">Company Logo</p>
            <p className="mt-1 text-xs text-slate-500">Shown on quotes and invoices.</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                {company?.logo_url ? (
                  <img src={company.logo_url} alt={`${company.name} logo`} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-xs text-slate-400">No logo</span>
                )}
              </div>
              <input
                ref={companyLogoInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(event) => {
                  void handleUploadCompanyLogo(event.target.files?.[0] ?? null);
                }}
              />
              <Button
                variant="secondary"
                loading={isUploadingLogo}
                onClick={() => companyLogoInputRef.current?.click()}
              >
                Upload Logo
              </Button>
              {company?.logo_url ? (
                <Button variant="ghost" disabled={isUploadingLogo} onClick={() => void handleRemoveCompanyLogo()}>
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={companyForm.name} onChange={(e) => setCompanyForm((s) => ({ ...s, name: e.target.value }))} placeholder="Company name" />
            <Input value={companyForm.abn ?? ''} onChange={(e) => setCompanyForm((s) => ({ ...s, abn: e.target.value }))} placeholder="ABN" />
            <Input value={companyForm.phone ?? ''} onChange={(e) => setCompanyForm((s) => ({ ...s, phone: e.target.value }))} placeholder="Phone" />
            <div>
              <Input value={companyForm.email ?? ''} onChange={(e) => setCompanyForm((s) => ({ ...s, email: e.target.value }))} placeholder="Reply-to Email" />
              <p className="mt-1 text-xs text-slate-500">Used as the reply-to address on invoice and quote emails</p>
            </div>
            <AddressAutocomplete
              className="md:col-span-2"
              value={companyForm.address ?? ''}
              onChange={(value) => setCompanyForm((state) => ({ ...state, address: value }))}
              onSelect={(suggestion) => {
                setCompanyForm((state) => ({
                  ...state,
                  address: suggestion.fullAddress,
                  city: suggestion.city ?? state.city,
                  state:
                    suggestion.stateCode &&
                    AU_STATES.includes(suggestion.stateCode as (typeof AU_STATES)[number])
                      ? suggestion.stateCode
                      : state.state,
                }));
              }}
              placeholder="Address"
            />
            <Input value={companyForm.city ?? ''} onChange={(e) => setCompanyForm((s) => ({ ...s, city: e.target.value }))} placeholder="City" />
            <Select value={companyForm.state} onChange={(e) => setCompanyForm((s) => ({ ...s, state: e.target.value }))}>
              {AU_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
            </Select>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => saveCompanyMutation.mutate()} loading={saveCompanyMutation.isPending}>Save Company</Button>
          </div>
        </Card>
      ) : null}

      {tab === 'Team Members' ? (
        <div className="space-y-4">
          <Card>
            <h3 className="text-lg font-semibold text-slate-900">Team Members</h3>
            <div className="mt-3 space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="grid gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3 md:grid-cols-4 md:items-center">
                  <div>
                    <p className="font-medium text-slate-900">{member.full_name}</p>
                    <p className="text-xs text-slate-500">{member.phone ?? '-'}</p>
                  </div>
                  <div className="text-sm text-slate-600">{member.id === user?.id ? 'You' : member.role}</div>
                  <div>
                    <Select value={member.role} onChange={(event) => saveTeamRoleMutation.mutate({ id: member.id, role: event.target.value as TeamRole, is_active: member.is_active })}>
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                      <option value="viewer">Viewer</option>
                    </Select>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant={member.is_active ? 'danger' : 'success'}
                      size="sm"
                      onClick={() => {
                        if (member.is_active && !window.confirm(`Deactivate ${member.full_name}? They will lose access immediately.`)) return;
                        saveTeamRoleMutation.mutate({ id: member.id, role: member.role, is_active: !member.is_active });
                      }}
                    >
                      {member.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-900">Invite Team Member</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <Input value={inviteForm.email} onChange={(event) => setInviteForm((state) => ({ ...state, email: event.target.value }))} placeholder="Email" />
              <Select value={inviteForm.role} onChange={(event) => setInviteForm((state) => ({ ...state, role: event.target.value as TeamRole }))}>
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="viewer">Viewer</option>
              </Select>
              <Button onClick={() => inviteMutation.mutate()} loading={inviteMutation.isPending}>Send Invite</Button>
            </div>

            <div className="mt-4 space-y-2">
              {(invitesQuery.data ?? []).map((invite: TeamInvite) => (
                <div key={invite.id} className="flex flex-wrap items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-sm text-slate-700">{invite.email} ({invite.role})</p>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={invite.status} />
                    <span className="text-xs text-slate-500">{formatDate(invite.invited_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {tab === 'Invoice Settings' ? (
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Invoice Settings</h3>
          <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-blue-800">
            Invoices are sent from <strong>{company?.name ?? 'your company'}</strong>.
            Customer replies go to <strong>{company?.email || 'no reply-to set'}</strong>.
            {!company?.email && <span className="ml-1 text-blue-600">Set this in Company Profile.</span>}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Select value={String(settingsForm.payment_terms_days)} onChange={(event) => setSettingsForm((state) => ({ ...state, payment_terms_days: Number(event.target.value) }))}>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </Select>
            <Input value={settingsForm.bank_name} onChange={(event) => setSettingsForm((state) => ({ ...state, bank_name: event.target.value }))} placeholder="Bank name (e.g. Commonwealth Bank)" />
            <Input value={settingsForm.bank_bsb} onChange={(event) => setSettingsForm((state) => ({ ...state, bank_bsb: event.target.value }))} placeholder="BSB" />
            <Input value={settingsForm.bank_account_number} onChange={(event) => setSettingsForm((state) => ({ ...state, bank_account_number: event.target.value }))} placeholder="Account number" />
            <Input value={settingsForm.bank_account_name} onChange={(event) => setSettingsForm((state) => ({ ...state, bank_account_name: event.target.value }))} placeholder="Account name" />
            <textarea
              className="md:col-span-2 h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={settingsForm.default_invoice_notes}
              onChange={(event) => setSettingsForm((state) => ({ ...state, default_invoice_notes: event.target.value }))}
              placeholder="Default invoice notes"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => saveSettingsMutation.mutate()} loading={saveSettingsMutation.isPending}>Save Invoice Settings</Button>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-semibold text-slate-900">Stripe Payments</h4>
                <p className="mt-0.5 text-sm text-slate-600">
                  Accept online payments for invoices and quotes.
                </p>
              </div>
              {stripeFullyConfigured ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <Check className="size-3.5" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                  Setup incomplete
                </span>
              )}
            </div>

            {/* ── Collapsible Setup Guide ── */}
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() => setStripeGuideOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors rounded-xl"
              >
                <span>How to set up Stripe (3 steps)</span>
                {stripeGuideOpen ? <ChevronDown className="size-4 text-slate-400" /> : <ChevronRight className="size-4 text-slate-400" />}
              </button>

              {stripeGuideOpen ? (
                <div className="space-y-4 border-t border-slate-200 px-4 pb-4 pt-3">
                  {/* Step 1 */}
                  <div className="flex gap-3">
                    <div className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                      stripeConfigQuery.data?.publishable_key && stripeConfigQuery.data?.has_secret_key
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-300 bg-white text-slate-400'
                    }`}>
                      {stripeConfigQuery.data?.publishable_key && stripeConfigQuery.data?.has_secret_key
                        ? <Check className="size-3.5" />
                        : '1'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">Get your API keys</p>
                      <ol className="mt-1.5 list-inside list-decimal space-y-1 text-xs text-slate-600">
                        <li>
                          Open{' '}
                          <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-medium text-blue-600 hover:text-blue-800 hover:underline">
                            Stripe Dashboard → API Keys <ExternalLink className="size-3" />
                          </a>
                        </li>
                        <li>
                          Copy the <strong>Publishable key</strong> (starts with <code className="rounded bg-slate-200 px-1 py-0.5 font-mono text-slate-700">pk_</code>)
                        </li>
                        <li>
                          Click "Reveal" next to <strong>Secret key</strong> and copy it (starts with <code className="rounded bg-slate-200 px-1 py-0.5 font-mono text-slate-700">sk_</code>)
                        </li>
                        <li>Paste both into the fields below and click <strong>Save Stripe Settings</strong></li>
                      </ol>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-3">
                    <div className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                      stripeConfigQuery.data?.has_webhook_secret
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-300 bg-white text-slate-400'
                    }`}>
                      {stripeConfigQuery.data?.has_webhook_secret
                        ? <Check className="size-3.5" />
                        : '2'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">Create a webhook endpoint</p>
                      <ol className="mt-1.5 list-inside list-decimal space-y-1 text-xs text-slate-600">
                        <li>
                          Open{' '}
                          <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-medium text-blue-600 hover:text-blue-800 hover:underline">
                            Stripe Dashboard → Webhooks <ExternalLink className="size-3" />
                          </a>
                        </li>
                        <li>Click <strong>Add endpoint</strong></li>
                        <li>
                          Paste this URL:
                          <span className="mt-1 flex items-center gap-1.5">
                            <code className="block min-w-0 flex-1 truncate rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-700 select-all">
                              {webhookUrl}
                            </code>
                            <button
                              type="button"
                              onClick={() => void handleCopyWebhookUrl()}
                              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                            >
                              <Copy className="size-3" />
                              Copy
                            </button>
                          </span>
                        </li>
                        <li>
                          Under "Select events to listen to", search for and add:{' '}
                          <code className="rounded bg-slate-200 px-1 py-0.5 font-mono text-slate-700">payment_intent.succeeded</code>
                        </li>
                        <li>Click <strong>Add endpoint</strong> to finish</li>
                      </ol>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-3">
                    <div className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                      stripeConfigQuery.data?.has_webhook_secret
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-300 bg-white text-slate-400'
                    }`}>
                      {stripeConfigQuery.data?.has_webhook_secret
                        ? <Check className="size-3.5" />
                        : '3'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">Save the signing secret</p>
                      <ol className="mt-1.5 list-inside list-decimal space-y-1 text-xs text-slate-600">
                        <li>Click on the webhook endpoint you just created</li>
                        <li>Find <strong>Signing secret</strong> and click <strong>Reveal</strong></li>
                        <li>
                          Copy the value (starts with <code className="rounded bg-slate-200 px-1 py-0.5 font-mono text-slate-700">whsec_</code>)
                        </li>
                        <li>Paste it into the <strong>Webhook Signing Secret</strong> field below and click <strong>Save Stripe Settings</strong></li>
                      </ol>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* ── Form fields ── */}
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Publishable Key
                </label>
                <Input
                  value={stripeForm.publishable_key}
                  onChange={(event) => setStripeForm((state) => ({ ...state, publishable_key: event.target.value }))}
                  placeholder="pk_live_... or pk_test_..."
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Secret Key
                </label>
                <Input
                  type="password"
                  value={stripeForm.secret_key}
                  onChange={(event) => setStripeForm((state) => ({ ...state, secret_key: event.target.value }))}
                  placeholder={stripeConfigQuery.data?.has_secret_key ? '••••••••  (already set — leave blank to keep)' : 'sk_live_... or sk_test_...'}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Webhook Signing Secret
                </label>
                <Input
                  type="password"
                  value={stripeForm.webhook_secret}
                  onChange={(event) => setStripeForm((state) => ({ ...state, webhook_secret: event.target.value }))}
                  placeholder={stripeConfigQuery.data?.has_webhook_secret ? '••••••••  (already set — leave blank to keep)' : 'whsec_...'}
                />
              </div>
            </div>

            {/* ── Status row ── */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="flex items-center gap-1 text-slate-500">
                {stripeConfigQuery.data?.publishable_key
                  ? <><Check className="size-3 text-emerald-500" /> Publishable key</>
                  : <><span className="size-3 rounded-full border border-slate-300 inline-block" /> Publishable key</>}
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                {stripeConfigQuery.data?.has_secret_key
                  ? <><Check className="size-3 text-emerald-500" /> Secret key</>
                  : <><span className="size-3 rounded-full border border-slate-300 inline-block" /> Secret key</>}
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                {stripeConfigQuery.data?.has_webhook_secret
                  ? <><Check className="size-3 text-emerald-500" /> Webhook</>
                  : <><span className="size-3 rounded-full border border-amber-400 bg-amber-100 inline-block" /> Webhook</>}
              </span>
            </div>

            {!stripeConfigQuery.data?.has_webhook_secret && stripeConfigQuery.data?.has_secret_key && !stripeGuideOpen ? (
              <button
                type="button"
                onClick={() => setStripeGuideOpen(true)}
                className="mt-2 text-xs font-medium text-amber-600 hover:text-amber-800 hover:underline"
              >
                Webhook not connected — payments won't auto-update. Open setup guide to finish.
              </button>
            ) : null}

            <div className="mt-4 flex justify-end">
              <Button onClick={() => saveStripeMutation.mutate()} loading={saveStripeMutation.isPending}>
                Save Stripe Settings
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {tab === 'My Profile' ? (
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">My Profile</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={profileForm.full_name} onChange={(event) => setProfileForm((state) => ({ ...state, full_name: event.target.value }))} placeholder="Full name" />
            <Input value={profileForm.phone ?? ''} onChange={(event) => setProfileForm((state) => ({ ...state, phone: event.target.value }))} placeholder="Phone" />
            <Input type="password" value={profileForm.password} onChange={(event) => setProfileForm((state) => ({ ...state, password: event.target.value }))} placeholder="New password" />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => saveProfileMutation.mutate()} loading={saveProfileMutation.isPending}>Save Profile</Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

