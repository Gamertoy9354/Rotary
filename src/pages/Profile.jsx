import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase, ROLE_LABELS } from '../lib/supabase';
import PostCard, { POST_SELECT } from '../components/PostCard';
import Spinner, { Empty } from '../components/Spinner';
import Avatar from '../components/Avatar';

export default function Profile() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [posts, setPosts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: p } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      setPerson(p ?? false);
      if (p) {
        const [{ data: ps }, { data: gm }, { data: pm }] = await Promise.all([
          supabase.from('posts').select(POST_SELECT).eq('author', id).order('created_at', { ascending: false }).limit(20),
          supabase.from('group_members').select('role, groups(id, name, slug, category)').eq('user_id', id),
          supabase.from('project_members').select('role, projects(id, title, slug, status)').eq('user_id', id),
        ]);
        setPosts(ps ?? []);
        setGroups(gm ?? []);
        setProjects(pm ?? []);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <main className="page"><Spinner /></main>;
  if (person === false) {
    return <main className="page"><div className="container"><Empty>Profile not found.</Empty></div></main>;
  }

  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 860 }}>
        <div className="card card-pad" style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap', marginBottom: 26 }}>
          <Avatar profile={person} size={92} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <h1 style={{ fontSize: '1.6rem' }}>{person.full_name || 'Unnamed profile'}</h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: '.92rem' }}>
              {person.title || ROLE_LABELS[person.role]}
              {person.member_since ? ` · Member since ${person.member_since}` : ''}
            </p>
            {person.bio && <p style={{ marginTop: 8, fontSize: '.95rem' }}>{person.bio}</p>}
          </div>
          <span className={`badge ${person.role === 'admin' ? 'badge-blue' : person.role === 'officer' ? 'badge-gold' : ''}`}>
            {ROLE_LABELS[person.role]}
          </span>
        </div>

        {(groups.length > 0 || projects.length > 0) && (
          <div className="grid-2" style={{ marginBottom: 26 }}>
            <div className="card card-pad">
              <h3 style={{ marginBottom: 12 }}>Groups</h3>
              {groups.length === 0 && <p style={{ color: 'var(--ink-soft)', fontSize: '.9rem' }}>Not in any group yet.</p>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {groups.map((g) => (
                  <Link key={g.groups.id} className="badge" to={`/groups/${g.groups.slug}`}>
                    {g.groups.name}{g.role === 'lead' ? ' · Lead' : ''}
                  </Link>
                ))}
              </div>
            </div>
            <div className="card card-pad">
              <h3 style={{ marginBottom: 12 }}>Projects</h3>
              {projects.length === 0 && <p style={{ color: 'var(--ink-soft)', fontSize: '.9rem' }}>No project memberships yet.</p>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {projects.map((p) => (
                  <Link key={p.projects.id} className="badge badge-gold" to={`/projects/${p.projects.slug}`}>
                    {p.projects.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        <h2 style={{ fontSize: '1.25rem', marginBottom: 14 }}>Posts</h2>
        <div style={{ display: 'grid', gap: 20 }}>
          {posts.length === 0 && <Empty>No posts yet.</Empty>}
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onDelete={(pid) => setPosts((all) => all.filter((x) => x.id !== pid))} />
          ))}
        </div>
      </div>
    </main>
  );
}
