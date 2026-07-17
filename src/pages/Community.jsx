import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, ROLE_LABELS } from '../lib/supabase';
import Spinner from '../components/Spinner';
import Wheel from '../components/Wheel';
import Avatar from '../components/Avatar';

export default function Community() {
  const [groups, setGroups] = useState(null);
  const [people, setPeople] = useState(null);
  const [counts, setCounts] = useState({});
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    supabase.from('groups').select('*').order('name').then(({ data }) => setGroups(data ?? []));
    supabase.from('group_members').select('group_id').then(({ data }) => {
      const c = {};
      (data ?? []).forEach((r) => { c[r.group_id] = (c[r.group_id] || 0) + 1; });
      setCounts(c);
    });

    // People = registered profiles + club roster entries who haven't signed up yet
    Promise.all([
      supabase.from('profiles').select('id, email, full_name, avatar_url, role, title, member_since, bio'),
      supabase.from('club_roster').select('email, full_name, role, title, member_since'),
    ]).then(([{ data: profiles }, { data: roster }]) => {
      const registered = (profiles ?? []).map((p) => ({ ...p, registered: true }));
      const seen = new Set(registered.map((p) => p.email?.toLowerCase()));
      const unregistered = (roster ?? [])
        .filter((r) => !seen.has(r.email?.toLowerCase()))
        .map((r) => ({ ...r, id: null, registered: false }));
      const order = { admin: 0, officer: 1, member: 2, visitor: 3 };
      const all = [...registered, ...unregistered].sort(
        (a, b) => (order[a.role] ?? 9) - (order[b.role] ?? 9) || a.full_name.localeCompare(b.full_name)
      );
      setPeople(all);
    });
  }, []);

  const roles = ['all', 'admin', 'officer', 'member', 'visitor'];
  const visible = people?.filter((p) => roleFilter === 'all' || p.role === roleFilter);

  return (
    <main className="page">
      <div className="container">
        <div className="page-head">
          <p className="eyebrow"><Wheel />Community</p>
          <h1>Groups, members & supporters</h1>
          <p>
            The club works through committees — each one leads its own projects. Below them,
            the full club directory: every Rotarian on the roster plus everyone who has joined
            the platform as a supporter.
          </p>
        </div>

        <h2 style={{ fontSize: '1.3rem', marginBottom: 18 }}>Committees & groups</h2>
        {groups === null ? <Spinner /> : (
          <div className="grid-3" style={{ marginBottom: 54 }}>
            {groups.map((g) => (
              <article className="card pcard" key={g.id}>
                <div className="pcard-body">
                  <div className="pcard-meta">
                    <span className="badge">{g.category}</span>
                    <span className="badge badge-gold">{counts[g.id] || 0} member{(counts[g.id] || 0) === 1 ? '' : 's'}</span>
                    <span className={`badge ${g.join_policy === 'open' ? 'badge-green' : ''}`}>
                      {g.join_policy === 'open' ? 'Open to join' : 'Joins reviewed'}
                    </span>
                  </div>
                  <h3><Link to={`/groups/${g.slug}`}>{g.name}</Link></h3>
                  <p>{g.description}</p>
                  <Link className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }} to={`/groups/${g.slug}`}>
                    View group
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        <h2 style={{ fontSize: '1.3rem', marginBottom: 14 }}>People</h2>
        <div className="tabs">
          {roles.map((r) => (
            <button key={r} className={roleFilter === r ? 'on' : ''} onClick={() => setRoleFilter(r)}>
              {r === 'all' ? `Everyone${people ? ` (${people.length})` : ''}` : `${ROLE_LABELS[r]}s`}
            </button>
          ))}
        </div>
        {people === null ? <Spinner /> : (
          <div className="card">
            {visible.length === 0 && <p className="empty">No one in this category yet.</p>}
            {visible.map((p) => (
              <div className="member-row" key={p.id ?? `roster-${p.email}`}>
                <Avatar profile={p.registered ? p : null} name={p.full_name} size={44} />
                <div className="m-meta">
                  <b>
                    {p.registered
                      ? <Link to={`/u/${p.id}`}>{p.full_name || 'Unnamed profile'}</Link>
                      : `Rtn. ${p.full_name}`}
                  </b>
                  <span>
                    {p.title || ROLE_LABELS[p.role]}
                    {p.member_since ? ` · member since ${p.member_since}` : ''}
                    {p.email && p.role !== 'visitor' ? ` · ${p.email}` : ''}
                  </span>
                </div>
                {!p.registered && <span className="badge badge-gold">On the club roster</span>}
                <span className={`badge ${p.role === 'admin' ? 'badge-blue' : p.role === 'officer' ? 'badge-gold' : ''}`}>
                  {ROLE_LABELS[p.role]}
                </span>
              </div>
            ))}
          </div>
        )}
        <p style={{ marginTop: 16, fontSize: '.86rem', color: 'var(--ink-soft)' }}>
          Rotarians marked &ldquo;on the club roster&rdquo; haven't registered on the platform yet —
          when they sign up with the email above, their member profile activates automatically.
        </p>
      </div>
    </main>
  );
}
