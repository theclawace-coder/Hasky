import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import {
  getCompanySettings,
  getProfiles,
  getStripeConfigStatus,
  getTeamInvites,
  inviteTeamMember,
  saveStripeConfig,
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

const tabs = ['Company Profile', 'Team Members', 'Cross-Hire Preferences', 'Invoice Settings', 'My Profile'] as const;
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
  bank_bsb: string;
  bank_account_number: string;
  bank_account_name: string;
  default_invoice_notes: string;
}

interface StripeFormState {
  publishable_key: string;
}

export default function Settings() {
  const { user, profile, company, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('Company Profile');

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
      allow_cross_hire: settingsQuery.data?.allow_cross_hire ?? true,
      payment_terms_days: settingsQuery.data?.payment_terms_days ?? 14,
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
    () => ({ publishable_key: stripeConfigQuery.data?.publishable_key ?? '' }),
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

  const saveCompanyMutation = useMutation({
    mutationFn: async () => {
      if (!company?.id) {
        throw new Error('Company not found');
      }
      const { error } = await supabase.from('companies').update(companyForm).eq('id', company.id);
      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: async () => {
      await refreshProfile();
      setCompanyFormDraft(null);
      toast.success('Company updated');
    },
  });

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
      toast.success('Settings updated');
    },
  });

  const saveStripeMutation = useMutation({
    mutationFn: () => saveStripeConfig({ publishable_key: stripeForm.publishable_key }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['stripe_config'] });
      toast.success('Stripe settings updated');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update Stripe settings');
    },
  });

  const saveTeamRoleMutation = useMutation({
    mutationFn: ({ id, role, is_active }: { id: string; role: TeamRole; is_active: boolean }) =>
      upsertProfile({ id, role, is_active }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profiles'] });
      toast.success('Team member updated');
    },
  });

  const inviteMutation = useMutation({
    mutationFn: () => inviteTeamMember(inviteForm),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['team_invites'] });
      toast.success('Invite sent');
      setInviteForm({ email: '', role: 'user' });
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
      toast.success('Profile updated');
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
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={companyForm.name} onChange={(e) => setCompanyForm((s) => ({ ...s, name: e.target.value }))} placeholder="Company name" />
            <Input value={companyForm.abn ?? ''} onChange={(e) => setCompanyForm((s) => ({ ...s, abn: e.target.value }))} placeholder="ABN" />
            <Input value={companyForm.phone ?? ''} onChange={(e) => setCompanyForm((s) => ({ ...s, phone: e.target.value }))} placeholder="Phone" />
            <Input value={companyForm.email ?? ''} onChange={(e) => setCompanyForm((s) => ({ ...s, email: e.target.value }))} placeholder="Email" />
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
                      onClick={() => saveTeamRoleMutation.mutate({ id: member.id, role: member.role, is_active: !member.is_active })}
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

      {tab === 'Cross-Hire Preferences' ? (
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Cross-Hire Preferences</h3>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={settingsForm.allow_cross_hire} onChange={(event) => setSettingsForm((state) => ({ ...state, allow_cross_hire: event.target.checked }))} />
            Allow cross-hire
          </label>
          <p className="text-sm text-slate-600">When enabled, your available machines can be surfaced to the platform admin for brokerage deals.</p>
          <div className="flex justify-end">
            <Button onClick={() => saveSettingsMutation.mutate()} loading={saveSettingsMutation.isPending}>Save Preferences</Button>
          </div>
        </Card>
      ) : null}

      {tab === 'Invoice Settings' ? (
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Invoice Settings</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <Select value={String(settingsForm.payment_terms_days)} onChange={(event) => setSettingsForm((state) => ({ ...state, payment_terms_days: Number(event.target.value) }))}>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
            </Select>
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
            <h4 className="text-base font-semibold text-slate-900">Stripe Payments</h4>
            <p className="mt-1 text-sm text-slate-600">
              Connect your company Stripe keys so customers can pay quote and invoice links online.
            </p>

            <div className="mt-3">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Publishable Key
              </label>
              <Input
                value={stripeForm.publishable_key}
                onChange={(event) => setStripeForm((state) => ({ ...state, publishable_key: event.target.value }))}
                placeholder="pk_live_... or pk_test_..."
              />
            </div>

            {/* Secret key security notice */}
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
              <p className="font-semibold text-amber-800">Secret key &amp; webhook secret — set via CLI only</p>
              <p className="mt-1 text-amber-700">
                For security, secret keys must never be stored in the database. Set them as Supabase Edge Function secrets:
              </p>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-amber-900/10 p-3 text-xs text-amber-900">
{`supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...`}
              </pre>
              <p className="mt-2 text-xs text-amber-600">
                Webhook endpoint to configure in Stripe: <code className="font-mono">/functions/v1/stripe-webhook</code>
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <StatusBadge status={stripeConfigQuery.data?.configured ? 'paid' : 'draft'} />
              <span className="text-slate-500">
                Secret key: {stripeConfigQuery.data?.has_secret_key ? '✓ configured' : 'not set'}
              </span>
              <span className="text-slate-500">
                Webhook: {stripeConfigQuery.data?.has_webhook_secret ? '✓ configured' : 'not set'}
              </span>
            </div>

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

