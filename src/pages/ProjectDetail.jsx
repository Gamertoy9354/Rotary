import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import PostCard, { POST_SELECT } from '../components/PostCard';
import Spinner, { Empty } from '../components/Spinner';
import Avatar from '../components/Avatar';
import Wheel from '../components/Wheel';
import { STATUS_LABEL } from '../components/ProjectCard';

export default function ProjectDetail() {
  const { slug } = useParams();
  const { user, isClub } = useAuth();
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: p } = await supabase
      .from('projects')
      .select('*, lead_group_info:groups(id, name, slug)')
      .eq('slug', slug)
      .maybeSingle();
    setProject(p ?? false);
    if (p) {
      const [{ data: pm }, { data: ps }] = await Promise.all([
        supabase.from('project_members')
          .select('role, user_id, profiles(id, full_name, avatar_url, title, role)')
          .eq('project_id', p.id),
        supabase.from('posts').select(POST_SELECT).eq('project_id', p.id).order('created_at', { ascending: false }),
      ]);
      setMembers(pm ?? []);
      setPosts(ps ?? []);
    }
    setLoading(false);
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const isTeamMember = members.some((m) => m.user_id === user?.id);

  async function joinLeave() {
    setJoining(true);
    if (isTeamMember) {
      await supabase.from('project_members').delete().eq('project_id', project.id).eq('user_id', user.id);
    } else {
      await supabase.from('project_members').insert({ project_id: project.id, user_id: user.id });
    }
    await load();
    setJoining(false);
  }

  if (loading) return <main className="page"><Spinner /></main>;
  if (project === false) {
    return (
      <main className="page"><div className="container"><Empty>Project not found. <Link to="/projects">Back to projects.</Link></Empty></div></main>
    );
  }

  return (
    <main className="page">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.6fr) minmax(0,1fr)', gap: 26, alignItems: 'start' }} className="project-layout">
          <div>
            <div className="card pcard" style={{ marginBottom: 24 }}>
              <div className="pcard-cover">
                {project.cover_url ? <img src={project.cover_url} alt={project.title} /> : <Wheel />}
              </div>
              <div className="pcard-body">
                <div className="pcard-meta">
                  <span className={`badge ${project.status === 'ongoing' ? 'badge-green' : project.status === 'completed' ? 'badge-gold' : ''}`}>
                    {STATUS_LABEL[project.status]}
                  </span>
                  <span className="badge">{project.category}</span>
                  {project.impact && <span className="pcard-impact">✦ {project.impact}</span>}
                </div>
                <h1 style={{ fontSize: '1.7rem' }}>{project.title}</h1>
                <p style={{ whiteSpace: 'pre-wrap', color: 'var(--ink-soft)' }}>{project.description || project.summary}</p>
                {project.lead_group_info && (
                  <p style={{ fontSize: '.9rem' }}>
                    Led by <Link to={`/groups/${project.lead_group_info.slug}`}><b>{project.lead_group_info.name}</b></Link>
                  </p>
                )}
              </div>
            </div>

            <h2 style={{ fontSize: '1.25rem', margin: '26px 0 14px' }}>Project updates</h2>
            <div style={{ display: 'grid', gap: 20 }}>
              {posts.length === 0 && <Empty>No updates posted yet for this project.</Empty>}
              {posts.map((p) => (
                <PostCard key={p.id} post={p} onDelete={(id) => setPosts((all) => all.filter((x) => x.id !== id))} />
              ))}
            </div>
          </div>

          <aside className="card card-pad">
            <h3 style={{ marginBottom: 6 }}>Project team</h3>
            <p style={{ fontSize: '.86rem', color: 'var(--ink-soft)', marginBottom: 14 }}>
              {members.length === 0 ? 'Be the first to sign up.' : `${members.length} member${members.length > 1 ? 's' : ''} collaborating.`}
            </p>
            <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
              {members.map((m) => (
                <Link key={m.user_id} to={`/u/${m.user_id}`} style={{ display: 'flex', gap: 10, alignItems: 'center', color: 'inherit' }}>
                  <Avatar profile={m.profiles} size={36} />
                  <span style={{ fontSize: '.92rem' }}>
                    <b>{m.profiles?.full_name}</b>
                    <span style={{ display: 'block', fontSize: '.76rem', color: 'var(--ink-soft)' }}>
                      {m.role === 'lead' ? 'Project Lead' : m.role === 'coordinator' ? 'Coordinator' : 'Volunteer'}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
            {isClub ? (
              <button className={`btn ${isTeamMember ? 'btn-ghost' : 'btn-gold'}`} style={{ width: '100%' }} onClick={joinLeave} disabled={joining}>
                {joining ? 'Working…' : isTeamMember ? 'Leave this project' : 'Join this project'}
              </button>
            ) : user ? (
              <p style={{ fontSize: '.84rem', color: 'var(--ink-soft)' }}>Project teams are open to club members. You can support this work on the <Link to="/donate">donations page</Link>.</p>
            ) : (
              <Link className="btn btn-blue" style={{ width: '100%' }} to="/login">Sign in to participate</Link>
            )}
          </aside>
        </div>
      </div>
      <style>{`@media (max-width: 880px){ .project-layout{ grid-template-columns: 1fr !important; } }`}</style>
    </main>
  );
}
