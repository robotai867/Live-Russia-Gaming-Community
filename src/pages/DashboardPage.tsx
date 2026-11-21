import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, Shield, Users, Megaphone,
  Activity as ActivityIcon, Radio, ArrowRight, Sparkles, Loader2,
  CalendarDays, Lightbulb, LifeBuoy, Music,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/store/AppContext';
import { PageHeader } from '@/components/AppShell';
import { Panel, PanelHeader, StatCard, Badge } from '@/components/ui';
import { Avatar, StatusBadge } from '@/components/Status';

interface ActivityRow {
  id: string;
  label: string;
  detail: string;
  created_at: string;
  profiles?: { handle: string; avatar_initials: string; accent: string } | null;
}

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  category: string;
  created_at: string;
}

interface ProfileRow {
  id: string;
  handle: string;
  display_name: string;
  avatar_initials: string;
  accent: string;
  discord_status: string;
  verified: boolean;
  game: string;
  reputation: number;
}

export function DashboardPage() {
  const { navigate, profile } = useApp();
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [onlineMembers, setOnlineMembers] = useState<ProfileRow[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [{ data: actData }, { data: annData }, { data: profData }, { count }] = await Promise.all([
      supabase.from('activity_logs').select('*, profiles:activity_logs_user_id_fkey(handle, avatar_initials, accent)').order('created_at', { ascending: false }).limit(5),
      supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(3),
      supabase.from('profiles').select('*').neq('discord_status', 'offline').limit(6),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
    ]);
    setActivity(actData as ActivityRow[] || []);
    setAnnouncements(annData as AnnouncementRow[] || []);
    setOnlineMembers(profData as ProfileRow[] || []);
    setMemberCount(count || 0);
    setVerifiedCount((profData as ProfileRow[] || []).filter(p => p.verified).length);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Member Dashboard"
        subtitle={`Welcome back, ${profile?.display_name || profile?.handle || 'Member'} — your community at a glance.`}
        icon={<LayoutDashboard className="h-5 w-5" />}
      />

      {/* Hero welcome banner */}
      <Panel className="relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-radial-gold" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar initials={profile?.avatar_initials || 'LR'} accent={profile?.accent || '#d4a017'} status={(profile?.discord_status as 'online'|'idle'|'dnd'|'offline') || 'online'} size="xl" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-2xl font-bold text-white">{profile?.display_name || 'Member'}</h2>
                {profile?.verified && <Badge variant="gold">Verified</Badge>}
              </div>
              <p className="mt-1 text-sm text-ink-300">
                {profile?.handle} · {profile?.reputation || 0} reputation
              </p>
              <div className="mt-3 flex items-center gap-3">
                <StatusBadge status={(profile?.discord_status as 'online'|'idle'|'dnd'|'offline') || 'online'} />
                <span className="text-xs text-ink-300">{profile?.game || 'No game set'}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <MiniStat icon={<Users className="h-4 w-4" />} label="Members" value={memberCount} />
            <MiniStat icon={<Shield className="h-4 w-4" />} label="Verified" value={verifiedCount} />
          </div>
        </div>
      </Panel>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Members" value={memberCount} icon={<Users className="h-5 w-5" />} accent="gold" />
        <StatCard label="Online Now" value={onlineMembers.length} icon={<Radio className="h-5 w-5" />} accent="blue" />
        <StatCard label="Announcements" value={announcements.length} icon={<Megaphone className="h-5 w-5" />} accent="green" />
        <StatCard label="Recent Activity" value={activity.length} icon={<ActivityIcon className="h-5 w-5" />} accent="amber" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent activity */}
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Recent Activity"
            subtitle="Community-wide events"
            icon={<ActivityIcon className="h-4 w-4" />}
            action={<button onClick={() => navigate('activity')} className="btn-ghost px-3 py-1.5 text-xs">View all <ArrowRight className="h-3 w-3" /></button>}
          />
          <div className="divide-y divide-white/5">
            {activity.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-300">No recent activity.</p>
            ) : activity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 px-5 py-3.5">
                {a.profiles && <Avatar initials={a.profiles.avatar_initials} accent={a.profiles.accent} size="sm" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white">
                    <span className="font-semibold">{a.profiles?.handle || 'System'}</span>{' '}
                    <span className="text-ink-300">— {a.label}</span>
                  </p>
                  <p className="truncate text-xs text-ink-300">{a.detail}</p>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-ink-400">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Latest announcements */}
        <Panel>
          <PanelHeader
            title="Latest"
            subtitle="Recent announcements"
            icon={<Megaphone className="h-4 w-4" />}
            action={<button onClick={() => navigate('announcements')} className="btn-ghost px-3 py-1.5 text-xs">All <ArrowRight className="h-3 w-3" /></button>}
          />
          <div className="space-y-3 p-5">
            {announcements.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-300">No announcements yet.</p>
            ) : announcements.map((an) => (
              <div key={an.id} className="rounded-lg border border-gold-500/15 bg-gold-500/5 p-3">
                <div className="flex items-center justify-between">
                  <Badge variant="gold">{an.category}</Badge>
                  <span className="text-[10px] text-ink-400">{new Date(an.created_at).toLocaleDateString()}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-white">{an.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-ink-300">{an.body}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Quick links + online members */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Quick Access" subtitle="Jump to a section" icon={<Sparkles className="h-4 w-4" />} />
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
            {[
              { id: 'community' as const, label: 'Community', icon: <Users className="h-5 w-5" /> },
              { id: 'staff' as const, label: 'Staff', icon: <Shield className="h-5 w-5" /> },
              { id: 'events' as const, label: 'Events', icon: <CalendarDays className="h-5 w-5" /> },
              { id: 'radio' as const, label: 'Radio', icon: <Music className="h-5 w-5" /> },
              { id: 'suggestions' as const, label: 'Suggestions', icon: <Lightbulb className="h-5 w-5" /> },
              { id: 'support' as const, label: 'Support', icon: <LifeBuoy className="h-5 w-5" /> },
              { id: 'announcements' as const, label: 'News', icon: <Megaphone className="h-5 w-5" /> },
              { id: 'activity' as const, label: 'Activity', icon: <ActivityIcon className="h-5 w-5" /> },
            ].map((q) => (
              <button
                key={q.id}
                onClick={() => navigate(q.id)}
                className="group flex flex-col items-start gap-3 rounded-xl border border-white/5 bg-ink-900/40 p-4 text-left transition-all hover:border-gold-500/30 hover:bg-ink-900/80"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400 transition-colors group-hover:bg-gold-500/20">
                  {q.icon}
                </span>
                <span className="text-sm font-semibold text-white">{q.label}</span>
              </button>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Online Members" subtitle="Active now" icon={<Radio className="h-4 w-4" />} />
          <div className="space-y-1 p-3">
            {onlineMembers.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-300">No members online.</p>
            ) : onlineMembers.map((m) => (
              <button
                key={m.id}
                onClick={() => { }}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/5"
              >
                <Avatar initials={m.avatar_initials || '??'} accent={m.accent} status={(m.discord_status as 'online'|'idle'|'dnd') || 'online'} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{m.handle}</p>
                  <p className="truncate text-xs text-ink-300">{m.game || 'Member'}</p>
                </div>
                <StatusBadge status={(m.discord_status as 'online'|'idle'|'dnd') || 'online'} withDot={false} />
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400">
        {icon}
      </div>
      <p className="font-display text-xl font-bold text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-ink-400">{label}</p>
    </div>
  );
}
