import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import PostCard, { POST_SELECT } from '../components/PostCard';
import ProjectCard from '../components/ProjectCard';
import Spinner, { Empty } from '../components/Spinner';
import Avatar from '../components/Avatar';
import Wheel from '../components/Wheel';

export default function GroupDetail() {
  const { slug } = useParams();
  const { user, isClub, isOfficer } = useAuth();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [posts, setPosts] = useState([]);
  const [myRequest, setMyRequest] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const isLead = members.some((m) => m.user_id === user?.id && m.role === 'lead');
  const canManage = isOfficer || isLead;

  const load = useCallback(async () => {
    setLoading(true);
    const { data: g } = await supabase.from('groups').select('*').eq('slug', slug).maybeSingle();
    setGroup(g ?? false);
    if (g) {
      const [{ data: gm }, { data: pr }, { data: ps }] = await Promise.all([
        supabase.from('group_members')
          .select('role, user_id, profiles(id, full_name, avatar_url, title, role)')
          .eq('group_id', g.id).order('role'),
        supabase.from('projects')
          .select('*, lead_group_info:groups(id, name, slug)')
          .eq('lead_group', g.id).order('created_at'),
        supabase.from('posts').select(POST_SELECT).eq('group_id', g.id).order('created_at', { ascending: false }).limit(20),
      ]);
      setMembers(gm ?? []);
      setProjects(pr ?? []);
      setPosts(ps ?? []);

      if (user) {
        const { data: mine } = await supabase.from('group_join_requests')
          .select('id, status').eq('group_id', g.id).eq('user_id', user.id)
          .eq('status', 'pending').maybeSingle();
        setMyRequest(mine ?? null);
        // Pending requests are only visible to leads/officers (RLS filters anyway)
        const { data: reqs } = await supabase.from('group_join_requests')
          .select('id, message, created_at, user_id, profiles!group_join_requests_user_id_fkey(id, full_name, avatar_url, title)')
          .eq('group_id', g.id).eq('status', 'pending').order('created_at');
        setPending((reqs ?? []).filter((r) => r.user_id !== user.id));
      }
    }
    setLoading(false);
  }, [slug, user]);

  useEffect(() => { load(); }, [load]);

  const inGroup = members.some((m) => m.user_id === user?.id);

  async function joinLeave() {
    setBusy(true);
    if (inGroup) {
      await supabase.from('group_members').delete().eq('group_id', group.id).eq('user_id', user.id);
    } else if (group.join_policy === 'open') {
      await supabase.from('group_members').insert({ group_id: group.id, user_id: user.id });
    } else {
      await supabase.from('group_join_requests').insert({ group_id: group.id, user_id: user.id });
    }
    await load();
    setBusy(false);
  }

  async function decide(req, approve) {
    setBusy(true);
    if (approve) {
      await supabase.from('group_members').insert({ group_id: group.id, user_id: req.user_id });
    }
    await supabase.from('group_join_requests')
      .update({ status: approve ? 'approved' : 'rejected', decided_by: user.id, decided_at: new Date().toISOString() })
      .eq('id', req.id);
    await load();
    setBusy(false);
  }

  if (loading) return <main className="page"><Spinner /></main>;
  if (group === false) {
    return <main className="page"><div className="container"><Empty>Group not found. <Link to="/community">Back to community.</Link></Empty></div></main>;
  }

  const leads = members.filter((m) => m.role === 'lead');

  return (
    <main className="page">
      <div className="container">
        <div className="card card-pad" style={{ marginBottom: 30, position: 'relative', overflow: 'hidden' }}>
          <Wheel className="hero-wheel" />
          <p className="eyebrow"><Wheel />{group.category} Committee</p>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 8 }}>{group.name}</h1>
          <p style={{ color: 'var(--ink-soft)', maxWidth: 640, marginBottom: 12 }}>{group.description}</p>
          <p style={{ fontSize: '.86rem', marginBottom: 14 }}>
            <span className={`badge ${group.join_policy === 'open' ? 'badge-green' : ''}`}>
              {group.join_policy === 'open' ? 'Open — club members join directly' : 'Joins reviewed by the group lead'}
            </span>
          </p>
          {leads.length > 0 && (
            <p style={{ fontSize: '.9rem', marginBottom: 14 }}>
              Led by {leads.map((l, i) => (
                <span key={l.user_id}>{i > 0 && ', '}<Link to={`/u/${l.user_id}`}><b>{l.profiles?.full_name}</b></Link></span>
              ))}
            </p>
          )}
          {isClub && (
            inGroup ? (
              <button className="btn btn-ghost btn-sm" onClick={joinLeave} disabled={busy}>
                {busy ? 'Working…' : 'Leave group'}
              </button>
            ) : myRequest ? (
              <span className="badge badge-gold">Join request pending review</span>
            ) : (
              <button className="btn btn-gold btn-sm" onClick={joinLeave} disabled={busy}>
                {busy ? 'Working…' : group.join_policy === 'open' ? 'Join this group' : 'Request to join'}
              </button>
            )
          )}
        </div>

        {canManage && pending.length > 0 && (
          <div className="card card-pad" style={{ marginBottom: 30, borderLeft: '4px solid var(--gold)' }}>
            <h2 style={{ fontSize: '1.15rem', marginBottom: 12 }}>Pending join requests ({pending.length})</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {pending.map((r) => (
                <div key={r.id} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Avatar profile={r.profiles} size={38} />
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <b><Link to={`/u/${r.user_id}`}>{r.profiles?.full_name}</Link></b>
                    <span style={{ display: 'block', fontSize: '.78rem', color: 'var(--ink-soft)' }}>
                      {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {r.message ? ` · ${r.message}` : ''}
                    </span>
                  </div>
                  <button className="btn btn-blue btn-sm" disabled={busy} onClick={() => decide(r, true)}>Approve</button>
                  <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => decide(r, false)}>Decline</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 26, alignItems: 'start' }} className="project-layout">
          <div>
            {projects.length > 0 && (
              <>
                <h2 style={{ fontSize: '1.25rem', marginBottom: 14 }}>Projects led by this group</h2>
                <div className="grid-2" style={{ marginBottom: 30 }}>
                  {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
                </div>
              </>
            )}
            <h2 style={{ fontSize: '1.25rem', margin: '10px 0 14px' }}>Group threads</h2>
            <div style={{ display: 'grid', gap: 20 }}>
              {posts.length === 0 && <Empty>No threads in this group yet.</Empty>}
              {posts.map((p) => (
                <PostCard key={p.id} post={p} onDelete={(id) => setPosts((all) => all.filter((x) => x.id !== id))} />
              ))}
            </div>
          </div>
          <aside className="card">
            <h3 style={{ padding: '18px 18px 8px' }}>Members ({members.length})</h3>
            {members.length === 0 && <p className="empty">No members yet.</p>}
            {members.map((m) => (
              <div className="member-row" key={m.user_id}>
                <Avatar profile={m.profiles} size={38} />
                <div className="m-meta">
                  <b><Link to={`/u/${m.user_id}`}>{m.profiles?.full_name}</Link></b>
                  <span>{m.role === 'lead' ? 'Group Lead' : m.profiles?.title || 'Member'}</span>
                </div>
                {canManage && m.user_id !== user?.id && m.role !== 'lead' && (
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={busy}
                    onClick={async () => {
                      if (!window.confirm(`Remove ${m.profiles?.full_name} from ${group.name}?`)) return;
                      setBusy(true);
                      await supabase.from('group_members').delete().eq('group_id', group.id).eq('user_id', m.user_id);
                      await load();
                      setBusy(false);
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </aside>
        </div>
      </div>
      <style>{`@media (max-width: 880px){ .project-layout{ grid-template-columns: 1fr !important; } }`}</style>
    </main>
  );
}
