import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Wheel from '../components/Wheel';

const CATEGORIES = ['Medical / Health', 'Education', 'Food & Essentials', 'Disaster / Emergency', 'Other'];

export default function Help() {
  const [form, setForm] = useState({ name: '', contact_email: '', phone: '', category: CATEGORIES[0], message: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await supabase.from('help_requests').insert(form);
    setBusy(false);
    if (error) {
      setMsg({ type: 'err', text: 'Could not send your request. Please try again, or call +91 98255 09107.' });
    } else {
      setMsg({ type: 'ok', text: 'Your request has reached the club. An officer will contact you — thank you for reaching out.' });
      setForm({ name: '', contact_email: '', phone: '', category: CATEGORIES[0], message: '' });
    }
  }

  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 640 }}>
        <div className="page-head" style={{ textAlign: 'center', margin: '0 auto 30px' }}>
          <p className="eyebrow" style={{ justifyContent: 'center' }}><Wheel />Request Help</p>
          <h1>If you need help, ask.</h1>
          <p>
            The club runs medical, education and community-support programs across Bardoli.
            Tell us what you or someone near you needs — a club officer reviews every request.
            No sign-in required.
          </p>
        </div>
        <form className="card card-pad" onSubmit={submit}>
          {msg && <p className={`form-msg ${msg.type}`}>{msg.text}</p>}
          <div className="grid-2">
            <div className="field">
              <label htmlFor="hn">Your name</label>
              <input id="hn" value={form.name} onChange={set('name')} required autoComplete="name" />
            </div>
            <div className="field">
              <label htmlFor="hc">Type of help</label>
              <select id="hc" value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="he">Email</label>
              <input id="he" type="email" value={form.contact_email} onChange={set('contact_email')} required autoComplete="email" />
            </div>
            <div className="field">
              <label htmlFor="hp">Phone (optional)</label>
              <input id="hp" type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="hm">What do you need?</label>
            <textarea id="hm" rows={5} value={form.message} onChange={set('message')} required
              placeholder="Describe the situation — who needs help, where, and how urgently." />
          </div>
          <button className="btn btn-blue" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Sending…' : 'Send request to the club'}
          </button>
          <p style={{ marginTop: 14, fontSize: '.82rem', color: 'var(--ink-soft)', textAlign: 'center' }}>
            Urgent? Call the club directly: <a href="tel:+919825509107">+91 98255 09107</a>
          </p>
        </form>
      </div>
    </main>
  );
}
