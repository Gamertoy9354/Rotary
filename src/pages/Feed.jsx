import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, uploadImage } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import PostCard, { POST_SELECT } from '../components/PostCard';
import Spinner, { Empty } from '../components/Spinner';
import Wheel from '../components/Wheel';
import Avatar from '../components/Avatar';

function Composer({ onPosted }) {
  const { user, profile } = useAuth();
  const [openForm, setOpenForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [groupId, setGroupId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [groups, setGroups] = useState([]);
  const [projects, setProjects] = useState([]);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!openForm) return;
    supabase.from('groups').select('id,name').order('name').then(({ data }) => setGroups(data ?? []));
    supabase.from('projects').select('id,title').order('title').then(({ data }) => setProjects(data ?? []));
  }, [openForm]);

  function pickFiles(e) {
    const picked = Array.from(e.target.files ?? []).slice(0, 4 - files.length);
    setFiles((f) => [...f, ...picked.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
    e.target.value = '';
  }

  async function submit(e) {
    e.preventDefault();
    if (!body.trim() && !title.trim()) return;
    setBusy(true); setErr('');
    try {
      const images = [];
      for (const f of files) images.push(await uploadImage(user.id, f.file));
      const { data, error } = await supabase
        .from('posts')
        .insert({
          author: user.id,
          title: title.trim(),
          body: body.trim(),
          images,
          group_id: groupId || null,
          project_id: projectId || null,
        })
        .select(POST_SELECT)
        .single();
      if (error) throw error;
      setTitle(''); setBody(''); setFiles([]); setGroupId(''); setProjectId(''); setOpenForm(false);
      onPosted(data);
    } catch (e2) {
      setErr(e2.message || 'Could not publish the post.');
    } finally {
      setBusy(false);
    }
  }

  if (!openForm) {
    return (
      <div className="card" style={{ padding: '16px 22px', display: 'flex', gap: 14, alignItems: 'center' }}>
        <Avatar profile={profile} size={40} />
        <button
          onClick={() => setOpenForm(true)}
          style={{
            flex: 1, textAlign: 'left', background: 'var(--mist)', border: 0, borderRadius: 999,
            padding: '11px 18px', fontFamily: 'var(--font-body)', color: 'var(--ink-soft)', cursor: 'pointer', fontSize: '.94rem',
          }}
        >
          Share an update, a project story, or photos…
        </button>
      </div>
    );
  }

  return (
    <form className="card card-pad" onSubmit={submit}>
      {err && <p className="form-msg err">{err}</p>}
      <div className="field">
        <label htmlFor="pt">Title</label>
        <input id="pt" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Blood donation camp at RNGPIT" />
      </div>
      <div className="field">
        <label htmlFor="pb">What happened?</label>
        <textarea id="pb" rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Tell the community about it…" />
      </div>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="pg">Group (optional)</label>
          <select id="pg" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">— none —</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="pp">Project (optional)</label>
          <select id="pp" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">— none —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
      </div>
      {files.length > 0 && (
        <div className="composer-imgs">
          {files.map((f, i) => (
            <span className="thumb" key={f.url}>
              <img src={f.url} alt="" />
              <button type="button" aria-label="Remove image" onClick={() => setFiles(files.filter((_, j) => j !== i))}>✕</button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
          📷 Add photos
          <input type="file" accept="image/*" multiple hidden onChange={pickFiles} disabled={files.length >= 4} />
        </label>
        <span style={{ fontSize: '.78rem', color: 'var(--ink-soft)' }}>{files.length}/4 images</span>
        <span style={{ flex: 1 }} />
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpenForm(false)}>Cancel</button>
        <button className="btn btn-blue btn-sm" disabled={busy || (!body.trim() && !title.trim())}>
          {busy ? 'Publishing…' : 'Publish'}
        </button>
      </div>
    </form>
  );
}

export default function Feed() {
  const { user, isClub } = useAuth();
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    supabase
      .from('posts')
      .select(POST_SELECT)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => setPosts(data ?? []));
  }, []);

  return (
    <main className="page">
      <div className="container">
        <div className="page-head" style={{ margin: '0 auto 30px', textAlign: 'center', maxWidth: 640 }}>
          <p className="eyebrow" style={{ justifyContent: 'center' }}><Wheel />Community Feed</p>
          <h1>Stories from the field</h1>
          <p>Updates, photos and threads from the club's groups and projects. {!user && <>Want to react or comment? <Link to="/login">Sign in.</Link></>}</p>
        </div>
        <div className="feed">
          {isClub && <Composer onPosted={(p) => setPosts((all) => [p, ...(all ?? [])])} />}
          {posts === null && <Spinner />}
          {posts?.length === 0 && <Empty>No posts yet — the first story is waiting to be told.</Empty>}
          {posts?.map((p) => (
            <PostCard key={p.id} post={p} onDelete={(id) => setPosts((all) => all.filter((x) => x.id !== id))} />
          ))}
        </div>
      </div>
    </main>
  );
}
