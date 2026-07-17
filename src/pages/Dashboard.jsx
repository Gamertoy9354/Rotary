import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, uploadImage, ROLE_LABELS } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Spinner, { Empty } from '../components/Spinner';
import Avatar from '../components/Avatar';
import Wheel from '../components/Wheel';

/* ── Profile editor (everyone) ── */
function ProfilePanel() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await supabase.from('profiles').update({ full_name: fullName, bio }).eq('id', user.id);
    setBusy(false);
    setMsg(error ? { type: 'err', text: error.message } : { type: 'ok', text: 'Profile saved.' });
    if (!error) refreshProfile();
  }

  async function changeAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setMsg(null);
    try {
      const url = await uploadImage(user.id, file);
      const { error } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
      if (error) throw error;
      refreshProfile();
      setMsg({ type: 'ok', text: 'Photo updated.' });
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card card-pad">
      <h2 style={{ fontSize: '1.3rem', marginBottom: 18 }}>My profile</h2>
      {msg && <p className={`form-msg ${msg.type}`}>{msg.text}</p>}
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginBottom: 22, flexWrap: 'wrap' }}>
        <Avatar profile={profile} size={76} />
        <div>
          <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
            Change photo
            <input type="file" accept="image/*" hidden onChange={changeAvatar} />
          </label>
          <p style={{ fontSize: '.8rem', color: 'var(--ink-soft)', marginTop: 6 }}>
            Signed in as {profile?.email} · <b>{profile?.title || ROLE_LABELS[profile?.role]}</b>
          </p>
        </div>
      </div>
      <form onSubmit={save}>
        <div className="field">
          <label htmlFor="fn">Full name</label>
          <input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="bio">About you</label>
          <textarea id="bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Profession, interests, why you serve…" />
        </div>
        <button className="btn btn-blue" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button>
      </form>
    </div>
  );
}

/* ── My groups & projects (club members) ── */
function MinePanel() {
  const { user } = useAuth();
  const [groups, setGroups] = useState(null);
  const [projects, setProjects] = useState(null);

  useEffect(() => {
    supabase.from('group_members').select('role, groups(id, name, slug, category)').eq('user_id', user.id)
      .then(({ data }) => setGroups(data ?? []));
    supabase.from('project_members').select('role, projects(id, title, slug, status, summary)').eq('user_id', user.id)
      .then(({ data }) => setProjects(data ?? []));
  }, [user.id]);

  if (groups === null || projects === null) return <Spinner />;
  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <div className="card card-pad">
        <h2 style={{ fontSize: '1.3rem', marginBottom: 6 }}>My groups</h2>
        <p style={{ fontSize: '.88rem', color: 'var(--ink-soft)', marginBottom: 14 }}>
          Committees you belong to. Join more from the <Link to="/community">community page</Link>.
        </p>
        {groups.length === 0 && <Empty>You haven't joined a group yet.</Empty>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {groups.map((g) => (
            <Link key={g.groups.id} className="badge" to={`/groups/${g.groups.slug}`}>
              {g.groups.name}{g.role === 'lead' ? ' · Lead' : ''}
            </Link>
          ))}
        </div>
      </div>
      <div className="card card-pad">
        <h2 style={{ fontSize: '1.3rem', marginBottom: 6 }}>My projects</h2>
        <p style={{ fontSize: '.88rem', color: 'var(--ink-soft)', marginBottom: 14 }}>
          Projects you're collaborating on. Find more on the <Link to="/projects">projects page</Link>.
        </p>
        {projects.length === 0 && <Empty>You haven't joined a project yet.</Empty>}
        <div style={{ display: 'grid', gap: 10 }}>
          {projects.map((p) => (
            <div key={p.projects.id} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link to={`/projects/${p.projects.slug}`}><b>{p.projects.title}</b></Link>
              <span className={`badge ${p.projects.status === 'ongoing' ? 'badge-green' : 'badge-gold'}`}>{p.projects.status}</span>
              <span className="badge">{p.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Become a member (visitors) ── */
function BecomeMemberPanel() {
  const { user } = useAuth();
  const [existing, setExisting] = useState(undefined); // undefined=loading, null=none
  const [form, setForm] = useState({ profession: '', phone: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const loadMine = () =>
    supabase.from('membership_requests').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setExisting(data ?? null));
  useEffect(() => { loadMine(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await supabase.from('membership_requests').insert({ user_id: user.id, ...form });
    setBusy(false);
    if (error) setMsg({ type: 'err', text: error.message });
    else { setMsg({ type: 'ok', text: 'Request sent! The club president and officers will review it.' }); loadMine(); }
  }

  if (existing === undefined) return <Spinner />;

  if (existing?.status === 'pending') {
    return (
      <div className="card card-pad">
        <h2 style={{ fontSize: '1.3rem', marginBottom: 10 }}>Membership request pending</h2>
        <p style={{ color: 'var(--ink-soft)' }}>
          Your request from {new Date(existing.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })} is
          with the club leadership. You'll see your role change on this dashboard once it's approved.
        </p>
      </div>
    );
  }

  return (
    <form className="card card-pad" onSubmit={submit}>
      <h2 style={{ fontSize: '1.3rem', marginBottom: 6 }}>Become a club member</h2>
      <p style={{ fontSize: '.9rem', color: 'var(--ink-soft)', marginBottom: 16 }}>
        Tell the club a little about yourself. Your request goes straight to the president,
        officers and board — they can approve you as a Member or Board of Director right here
        on the platform.
      </p>
      {existing?.status === 'rejected' && (
        <p className="form-msg err">Your previous request was not approved. You're welcome to apply again.</p>
      )}
      {msg && <p className={`form-msg ${msg.type}`}>{msg.text}</p>}
      <div className="grid-2">
        <div className="field">
          <label htmlFor="mrp">Profession</label>
          <input id="mrp" value={form.profession} onChange={set('profession')} placeholder="e.g. Doctor, Engineer, Business owner" required />
        </div>
        <div className="field">
          <label htmlFor="mrph">Phone (only leadership sees this)</label>
          <input id="mrph" type="tel" value={form.phone} onChange={set('phone')} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="mrm">Why do you want to join Rotary?</label>
        <textarea id="mrm" rows={4} value={form.message} onChange={set('message')} required
          placeholder="A few lines about you and the service work you'd like to be part of." />
      </div>
      <button className="btn btn-gold" disabled={busy}>{busy ? 'Sending…' : 'Send membership request'}</button>
    </form>
  );
}

/* ── Membership requests (officers) ── */
function MembershipRequestsPanel() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    supabase.from('membership_requests')
      .select('*, applicant:profiles!membership_requests_user_id_fkey(id, full_name, avatar_url, email)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);

  async function decide(req, approve, asDirector = false) {
    setBusy(true);
    if (approve) {
      await supabase.from('profiles').update(
        asDirector
          ? { role: 'officer', title: 'Board of Director' }
          : { role: 'member' }
      ).eq('id', req.user_id);
    }
    await supabase.from('membership_requests')
      .update({ status: approve ? 'approved' : 'rejected', decided_by: user.id, decided_at: new Date().toISOString() })
      .eq('id', req.id);
    await load();
    setBusy(false);
  }

  if (rows === null) return <Spinner />;
  const pending = rows.filter((r) => r.status === 'pending');
  const decided = rows.filter((r) => r.status !== 'pending');

  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <div className="card card-pad">
        <h2 style={{ fontSize: '1.3rem', marginBottom: 6 }}>Membership requests</h2>
        <p style={{ fontSize: '.88rem', color: 'var(--ink-soft)', marginBottom: 16 }}>
          Approving as <b>Member</b> unlocks posting, groups and projects. Approving as
          <b> Board of Director</b> also grants officer tools (this inbox, donations, group creation).
        </p>
        {pending.length === 0 && <Empty>No pending requests.</Empty>}
        <div style={{ display: 'grid', gap: 18 }}>
          {pending.map((r) => (
            <div key={r.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                <Avatar profile={r.applicant} size={42} />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <b><Link to={`/u/${r.user_id}`}>{r.applicant?.full_name || 'Profile'}</Link></b>
                  <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--ink-soft)' }}>
                    {r.applicant?.email}{r.phone ? ` · ${r.phone}` : ''} · {r.profession || 'profession not given'}
                  </span>
                </div>
                <span style={{ fontSize: '.76rem', color: 'var(--ink-soft)' }}>
                  {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p style={{ fontSize: '.92rem', color: 'var(--ink-soft)', margin: '0 0 12px 54px', whiteSpace: 'pre-wrap' }}>{r.message}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginLeft: 54 }}>
                <button className="btn btn-blue btn-sm" disabled={busy} onClick={() => decide(r, true, false)}>Approve as Member</button>
                <button className="btn btn-gold btn-sm" disabled={busy} onClick={() => decide(r, true, true)}>Approve as Board of Director</button>
                <button className="btn btn-danger btn-sm" disabled={busy} onClick={() => decide(r, false)}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {decided.length > 0 && (
        <div className="card card-pad">
          <h3 style={{ marginBottom: 12 }}>Decided</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            {decided.map((r) => (
              <div key={r.id} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '.9rem' }}>
                <span className={`badge ${r.status === 'approved' ? 'badge-green' : 'badge-red'}`}>{r.status}</span>
                <span>{r.applicant?.full_name}</span>
                <span style={{ color: 'var(--ink-soft)', fontSize: '.78rem' }}>
                  {r.decided_at && new Date(r.decided_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Help requests (officers) ── */
function HelpPanel() {
  const [rows, setRows] = useState(null);

  const load = () =>
    supabase.from('help_requests').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);

  async function setStatus(id, status) {
    await supabase.from('help_requests').update({ status }).eq('id', id);
    load();
  }

  if (rows === null) return <Spinner />;
  return (
    <div className="card">
      <h2 style={{ fontSize: '1.3rem', padding: '20px 22px 4px' }}>Help requests</h2>
      <p style={{ fontSize: '.88rem', color: 'var(--ink-soft)', padding: '0 22px 14px' }}>
        Requests from the public. Only officers can see this — treat contact details with care.
      </p>
      {rows.length === 0 && <Empty>No help requests yet.</Empty>}
      {rows.length > 0 && (
        <div className="dtable-wrap">
          <table className="dtable">
            <thead><tr><th>From</th><th>Category</th><th>Message</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.name}
                    <span style={{ display: 'block', fontWeight: 400, fontSize: '.8rem' }}>
                      <a href={`mailto:${r.contact_email}`}>{r.contact_email}</a>{r.phone ? ` · ${r.phone}` : ''}
                    </span>
                    <span style={{ display: 'block', fontWeight: 400, fontSize: '.74rem', color: 'var(--ink-soft)' }}>
                      {new Date(r.created_at).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td>{r.category}</td>
                  <td style={{ maxWidth: 340, whiteSpace: 'pre-wrap' }}>{r.message}</td>
                  <td>
                    <span className={`badge ${r.status === 'new' ? 'badge-red' : r.status === 'in_review' ? 'badge-gold' : 'badge-green'}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {r.status !== 'in_review' && <button className="btn btn-ghost btn-sm" onClick={() => setStatus(r.id, 'in_review')}>Review</button>}
                      {r.status !== 'resolved' && <button className="btn btn-blue btn-sm" onClick={() => setStatus(r.id, 'resolved')}>Resolve</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Donations (officers) ── */
function DonationsPanel() {
  const [rows, setRows] = useState(null);
  const load = () =>
    supabase.from('donations').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);

  async function markReceived(id) {
    await supabase.from('donations').update({ status: 'received' }).eq('id', id);
    load();
  }

  if (rows === null) return <Spinner />;
  const total = rows.filter((r) => r.status === 'received').reduce((s, r) => s + Number(r.amount), 0);
  return (
    <div className="card">
      <h2 style={{ fontSize: '1.3rem', padding: '20px 22px 4px' }}>Donation pledges</h2>
      <p style={{ fontSize: '.88rem', color: 'var(--ink-soft)', padding: '0 22px 14px' }}>
        ₹{total.toLocaleString('en-IN')} received so far. Mark a pledge received once payment is completed offline.
      </p>
      {rows.length === 0 && <Empty>No pledges yet.</Empty>}
      {rows.length > 0 && (
        <div className="dtable-wrap">
          <table className="dtable">
            <thead><tr><th>Donor</th><th>Amount</th><th>Purpose</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.donor_name}
                    <span style={{ display: 'block', fontWeight: 400, fontSize: '.8rem' }}>
                      <a href={`mailto:${r.donor_email}`}>{r.donor_email}</a>
                    </span>
                    {r.message && <span style={{ display: 'block', fontWeight: 400, fontSize: '.8rem', color: 'var(--ink-soft)' }}>&ldquo;{r.message}&rdquo;</span>}
                  </td>
                  <td>₹{Number(r.amount).toLocaleString('en-IN')}</td>
                  <td>{r.purpose}</td>
                  <td><span className={`badge ${r.status === 'received' ? 'badge-green' : 'badge-gold'}`}>{r.status}</span></td>
                  <td>{r.status === 'pledged' && <button className="btn btn-blue btn-sm" onClick={() => markReceived(r.id)}>Mark received</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Create project / group (officers & members-projects) ── */
function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || `item-${Date.now()}`;
}

function CreateProjectPanel() {
  const { user, isOfficer } = useAuth();
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({ title: '', summary: '', description: '', category: 'Health', status: 'planning', lead_group: '', impact: '' });
  const [cover, setCover] = useState(null);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    supabase.from('groups').select('id,name').order('name').then(({ data }) => setGroups(data ?? []));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      let cover_url = null;
      if (cover) cover_url = await uploadImage(user.id, cover);
      const { data, error } = await supabase.from('projects').insert({
        ...form,
        lead_group: form.lead_group || null,
        slug: slugify(form.title),
        cover_url,
        created_by: user.id,
      }).select('slug').single();
      if (error) throw error;
      setMsg({ type: 'ok', text: 'Project created.' });
      setForm({ title: '', summary: '', description: '', category: 'Health', status: 'planning', lead_group: '', impact: '' });
      setCover(null);
      setTimeout(() => { window.location.assign(`/projects/${data.slug}`); }, 700);
    } catch (err) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card card-pad" onSubmit={submit}>
      <h2 style={{ fontSize: '1.3rem', marginBottom: 6 }}>Start a project</h2>
      <p style={{ fontSize: '.88rem', color: 'var(--ink-soft)', marginBottom: 16 }}>
        {isOfficer ? 'Officers can start projects for any group.' : 'Club members can propose and start projects.'}
      </p>
      {msg && <p className={`form-msg ${msg.type}`}>{msg.text}</p>}
      <div className="field">
        <label htmlFor="npt">Title</label>
        <input id="npt" value={form.title} onChange={set('title')} required />
      </div>
      <div className="field">
        <label htmlFor="nps">One-line summary</label>
        <input id="nps" value={form.summary} onChange={set('summary')} required />
      </div>
      <div className="field">
        <label htmlFor="npd">Description</label>
        <textarea id="npd" rows={5} value={form.description} onChange={set('description')} />
      </div>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="npc">Category</label>
          <select id="npc" value={form.category} onChange={set('category')}>
            {['Health', 'Education', 'Environment', 'Community', 'Fellowship', 'Sports', 'Youth'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="npst">Status</label>
          <select id="npst" value={form.status} onChange={set('status')}>
            <option value="planning">Planning</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="npg">Lead group</label>
          <select id="npg" value={form.lead_group} onChange={set('lead_group')}>
            <option value="">— none —</option>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="npi">Impact line (optional)</label>
          <input id="npi" value={form.impact} onChange={set('impact')} placeholder="e.g. 500 families reached" />
        </div>
      </div>
      <div className="field">
        <label>Cover photo (optional)</label>
        <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
          {cover ? `📷 ${cover.name}` : '📷 Choose image'}
          <input type="file" accept="image/*" hidden onChange={(e) => setCover(e.target.files?.[0] ?? null)} />
        </label>
      </div>
      <button className="btn btn-blue" disabled={busy}>{busy ? 'Creating…' : 'Create project'}</button>
    </form>
  );
}

function CreateGroupPanel() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', category: 'Community', description: '', join_policy: 'open' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { data, error } = await supabase.from('groups')
      .insert({ ...form, slug: slugify(form.name), created_by: user.id })
      .select('id, slug').single();
    if (!error && data) {
      await supabase.from('group_members').insert({ group_id: data.id, user_id: user.id, role: 'lead' });
      setMsg({ type: 'ok', text: 'Group created — you are its lead.' });
      setForm({ name: '', category: 'Community', description: '' });
      setTimeout(() => window.location.assign(`/groups/${data.slug}`), 700);
    } else {
      setMsg({ type: 'err', text: error?.message ?? 'Could not create group.' });
    }
    setBusy(false);
  }

  return (
    <form className="card card-pad" onSubmit={submit}>
      <h2 style={{ fontSize: '1.3rem', marginBottom: 16 }}>Create a group</h2>
      {msg && <p className={`form-msg ${msg.type}`}>{msg.text}</p>}
      <div className="field">
        <label htmlFor="ngn">Group name</label>
        <input id="ngn" value={form.name} onChange={set('name')} required />
      </div>
      <div className="field">
        <label htmlFor="ngc">Category</label>
        <select id="ngc" value={form.category} onChange={set('category')}>
          {['Health', 'Education', 'Environment', 'Community', 'Fellowship', 'Sports', 'Youth'].map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="ngd">Description</label>
        <textarea id="ngd" rows={4} value={form.description} onChange={set('description')} required />
      </div>
      <div className="field">
        <label htmlFor="ngj">Who can join?</label>
        <select id="ngj" value={form.join_policy} onChange={set('join_policy')}>
          <option value="open">Open — any club member joins directly</option>
          <option value="approval">Approval — the group lead reviews join requests</option>
        </select>
      </div>
      <button className="btn btn-blue" disabled={busy}>{busy ? 'Creating…' : 'Create group'}</button>
    </form>
  );
}

/* ── Dashboard shell ── */
export default function Dashboard() {
  const { profile, isClub, isOfficer } = useAuth();
  const [tab, setTab] = useState('profile');
  if (!profile) return <main className="page"><Spinner /></main>;

  const tabs = [
    { id: 'profile', label: 'My Profile', show: true },
    { id: 'become', label: 'Become a Member', show: !isClub },
    { id: 'mine', label: 'My Groups & Projects', show: isClub },
    { id: 'newproject', label: 'Start a Project', show: isClub },
    { id: 'membership', label: 'Membership Requests', show: isOfficer, officer: true },
    { id: 'help', label: 'Help Requests', show: isOfficer, officer: true },
    { id: 'donations', label: 'Donations', show: isOfficer, officer: true },
    { id: 'newgroup', label: 'Create a Group', show: isOfficer, officer: true },
  ];

  return (
    <main className="page">
      <div className="container">
        <div className="page-head">
          <p className="eyebrow"><Wheel />{profile.title || ROLE_LABELS[profile.role]} Panel</p>
          <h1>Welcome, {profile.full_name?.split(' ')[0] || 'friend'}.</h1>
          {!isClub && (
            <p>
              You're registered as a community supporter — you can follow the feed, like, comment and
              donate. If you're a club member, sign up with the email the club has on file to unlock
              member tools automatically.
            </p>
          )}
        </div>
        <div className="dash">
          <nav className="card dash-side" aria-label="Dashboard sections">
            {tabs.filter((t) => t.show && !t.officer).map((t) => (
              <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
            {isOfficer && <><div className="divider" /><p className="side-label">Officer tools</p></>}
            {tabs.filter((t) => t.show && t.officer).map((t) => (
              <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
            ))}
          </nav>
          <div>
            {tab === 'profile' && <ProfilePanel />}
            {tab === 'become' && !isClub && <BecomeMemberPanel />}
            {tab === 'mine' && isClub && <MinePanel />}
            {tab === 'newproject' && isClub && <CreateProjectPanel />}
            {tab === 'membership' && isOfficer && <MembershipRequestsPanel />}
            {tab === 'help' && isOfficer && <HelpPanel />}
            {tab === 'donations' && isOfficer && <DonationsPanel />}
            {tab === 'newgroup' && isOfficer && <CreateGroupPanel />}
          </div>
        </div>
      </div>
    </main>
  );
}
