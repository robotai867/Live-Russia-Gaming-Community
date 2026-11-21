import { useState, useEffect, useCallback } from 'react';
import {
  User,
  Calendar,
  Gamepad2,
  CheckCircle2,
  Radio,
  Pencil,
  Share2,
  Star,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/store/AppContext';
import { PageHeader } from '@/components/AppShell';
import { Panel, PanelHeader, Badge, EmptyState } from '@/components/ui';
import { Avatar, StatusBadge } from '@/components/Status';
import { AttachmentUpload } from '@/components/AttachmentUpload';
import { roleIcon, roleIconWithColor } from '@/lib/roleIcons';
import { roleMeta, type RbacRole } from '@/lib/rbac';

interface ProfileData {
  id: string;
  handle: string;
  display_name: string;
  avatar_initials: string;
  accent: string;
  bio: string;
  game: string;
  verified: boolean;
  discord_connected: boolean;
  discord_username: string | null;
  discord_status: string;
  reputation: number;
  created_at: string;
}

interface ActivityRow {
  id: string;
  label: string;
  detail: string;
  created_at: string;
}

export function ProfilePage() {
  const { profile, user, refreshProfile, profileId, setProfileId, navigate } = useApp();
  const [tab, setTab] = useState<'overview' | 'activity' | 'files'>('overview');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: '', bio: '', game: '' });
  const [saving, setSaving] = useState(false);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [viewedProfile, setViewedProfile] = useState<ProfileData | null>(null);
  const [loadingViewed, setLoadingViewed] = useState(false);
  const [viewedRole, setViewedRole] = useState<RbacRole>('Normal Member');
  const [viewedSecondaryRole, setViewedSecondaryRole] = useState<RbacRole | null>(null);

  const isOwnProfile = !profileId || profileId === user?.id;

  const fetchActivity = useCallback(async (uid: string) => {
    setLoadingActivity(true);
    const { data } = await supabase
      .from('activity_logs')
      .select('id, label, detail, created_at')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(20);
    setActivity((data as ActivityRow[]) || []);
    setLoadingActivity(false);
  }, []);

  const fetchViewedProfile = useCallback(async (uid: string) => {
    setLoadingViewed(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    setViewedProfile(data as ProfileData | null);

    const { data: authData } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', uid)
      .maybeSingle();

    if (authData) {
      const { data: roleData } = await supabase.rpc('get_user_role', { target_user: uid });
      if (roleData && typeof roleData === 'string') {
        setViewedRole(roleData as RbacRole);
      }
    }

    setViewedSecondaryRole(null);
    setLoadingViewed(false);
  }, []);

  useEffect(() => {
    if (isOwnProfile) {
      setViewedProfile(null);
      if (user?.id) fetchActivity(user.id);
    } else {
      fetchViewedProfile(profileId);
      fetchActivity(profileId);
    }
  }, [isOwnProfile, profileId, user?.id, fetchActivity, fetchViewedProfile]);

  const activeProfile = isOwnProfile ? profile : viewedProfile;

  const startEdit = () => {
    setEditForm({
      display_name: profile?.display_name || '',
      bio: profile?.bio || '',
      game: profile?.game || '',
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: editForm.display_name,
        bio: editForm.bio,
        game: editForm.game,
      })
      .eq('id', user.id);
    setSaving(false);
    if (!error) {
      await refreshProfile();
      setEditing(false);
    }
  };

  const goBack = () => {
    setProfileId(user?.id || '');
    navigate('community');
  };

  if (!isOwnProfile && loadingViewed) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
      </div>
    );
  }

  const discordStatus = (activeProfile.discord_status as 'online' | 'idle' | 'dnd' | 'offline') || 'offline';
  const displayRole = isOwnProfile ? (profile ? (user?.app_metadata?.role as RbacRole) || 'Normal Member' : 'Normal Member') : viewedRole;
  const secondaryRole = viewedSecondaryRole;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isOwnProfile ? 'My Profile' : 'Member Profile'}
        subtitle={isOwnProfile ? 'Your community identity and record' : `Viewing ${activeProfile.handle}`}
        icon={<User className="h-5 w-5" />}
        actions={!isOwnProfile ? (
          <button onClick={goBack} className="btn-ghost px-3 py-2 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Directory
          </button>
        ) : undefined}
      />

      <Panel className="relative overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-ink-800 via-ink-850 to-ink-900">
          <div className="pointer-events-none absolute inset-0 bg-grid-dark bg-grid-32 opacity-30" />
          <div
            className="absolute -right-20 -top-20 h-60 w-60 rounded-full blur-3xl"
            style={{ background: `${activeProfile.accent || '#d4a017'}15` }}
          />
        </div>
        <div className="px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="-mt-12 flex items-end gap-4">
              <div className="rounded-2xl ring-4 ring-ink-850">
                <Avatar initials={activeProfile.avatar_initials || 'LR'} accent={activeProfile.accent || '#d4a017'} status={discordStatus} size="xl" ring={false} />
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-2xl font-bold text-white">{activeProfile.display_name}</h2>
                  {activeProfile.verified && (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  )}
                </div>
                <p className="text-sm text-ink-300">@{activeProfile.handle}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {displayRole === 'Server Owner' ? (
                    <span className="title-owner flex items-center gap-1 text-xs font-semibold">
                      {roleIconWithColor('Server Owner', '#d4a017')} Server Owner
                    </span>
                  ) : displayRole === 'Administrator' ? (
                    <span className="title-admin flex items-center gap-1 text-xs font-semibold">
                      {roleIconWithColor('Administrator', '#ef4444')} Administrator
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: roleMeta[displayRole]?.color || '#7a7a86' }}>
                      {roleIcon(displayRole)} {displayRole}
                    </span>
                  )}
                  {secondaryRole && (
                    <span className="flex items-center gap-1 rounded-full border border-gold-500/30 bg-gold-500/10 px-2 py-0.5 text-[10px] font-semibold text-gold-300">
                      {roleIconWithColor(secondaryRole, '#d4a017')} {secondaryRole}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-ghost px-3 py-2 text-xs">
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
              {isOwnProfile && (
                editing ? (
                  <>
                    <button onClick={() => setEditing(false)} className="btn-ghost px-3 py-2 text-xs">Cancel</button>
                    <button onClick={saveEdit} disabled={saving} className="btn-gold px-3 py-2 text-xs">
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
                    </button>
                  </>
                ) : (
                  <button onClick={startEdit} className="btn-gold px-3 py-2 text-xs">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                )
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <StatusBadge status={discordStatus} />
            {activeProfile.verified ? <Badge variant="green">Verified</Badge> : <Badge variant="amber">Pending Verification</Badge>}
            {activeProfile.discord_connected && (
              <Badge variant="violet">
                <Radio className="h-3 w-3" /> Discord linked
              </Badge>
            )}
          </div>

          {isOwnProfile && editing ? (
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-ink-400">Display Name</label>
                <input
                  value={editForm.display_name}
                  onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-ink-400">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  className="input-field resize-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-ink-400">Main Game</label>
                <input
                  value={editForm.game}
                  onChange={(e) => setEditForm({ ...editForm, game: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          ) : (
            <>
              <p className="mt-4 max-w-2xl text-sm text-ink-200">{activeProfile.bio || 'No bio set yet.'}</p>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <InfoChip icon={<Calendar className="h-3.5 w-3.5" />} label="Joined" value={new Date(activeProfile.created_at).toLocaleDateString()} />
                <InfoChip icon={<Gamepad2 className="h-3.5 w-3.5" />} label="Main Game" value={activeProfile.game || 'Not set'} />
                <InfoChip
                  icon={<Radio className="h-3.5 w-3.5" />}
                  label="Discord"
                  value={activeProfile.discord_connected ? activeProfile.discord_username ?? 'Linked' : 'Not connected'}
                />
                <InfoChip icon={<Star className="h-3.5 w-3.5" />} label="Reputation" value={`${activeProfile.reputation || 0}`} />
              </div>
            </>
          )}
        </div>
      </Panel>

      <div className="flex gap-1 rounded-lg border border-white/5 bg-ink-900/60 p-1">
        {(['overview', 'activity'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              tab === t ? 'bg-gold-500/15 text-gold-200' : 'text-ink-300 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
        {isOwnProfile && (
          <button
            onClick={() => setTab('files')}
            className={`flex-1 rounded-md px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
              tab === 'files' ? 'bg-gold-500/15 text-gold-200' : 'text-ink-300 hover:text-white'
            }`}
          >
            files
          </button>
        )}
      </div>

      {tab === 'overview' && (
        <Panel>
          <PanelHeader title="Presence" subtitle="Discord status" icon={<Radio className="h-4 w-4" />} />
          <div className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-300">Current status</span>
              <StatusBadge status={discordStatus} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-300">Discord account</span>
              <span className={`text-xs font-semibold ${activeProfile.discord_connected ? 'text-emerald-300' : 'text-ink-400'}`}>
                {activeProfile.discord_connected ? 'Connected' : 'Not linked'}
              </span>
            </div>
            {!activeProfile.discord_connected && (
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] text-amber-200/80">
                Discord integration requires authorized bot setup. Status will appear here once connected.
              </p>
            )}
          </div>
        </Panel>
      )}

      {tab === 'activity' && (
        <Panel>
          <PanelHeader title="Member Activity" subtitle="Recent records" icon={<Star className="h-4 w-4" />} />
          <div className="divide-y divide-white/5">
            {loadingActivity ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gold-500" />
              </div>
            ) : activity.length === 0 ? (
              <EmptyState icon={<Star className="h-6 w-6" />} title="No activity yet" subtitle="Community activity will appear here." />
            ) : activity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 px-5 py-3.5">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400">
                  <Star className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{a.label}</p>
                  <p className="text-xs text-ink-300">{a.detail}</p>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-ink-400">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === 'files' && isOwnProfile && (
        <AttachmentUpload table="profiles" />
      )}
    </div>
  );
}

function InfoChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-ink-900/50 p-3">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-ink-400">
        {icon} {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
