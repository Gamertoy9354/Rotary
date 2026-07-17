import { useState } from 'react';
import { supabase } from '../lib/supabase';
import Wheel from '../components/Wheel';

const PURPOSES = ['General Fund', 'Mammography Camps', 'Dialysis Program', 'TB Patient Nutrition (Akshay)', 'Education Programs', 'Environment / Tree Plantation', 'Subhash Sangram Fun Run'];
const AMOUNTS = [501, 1100, 2100, 5100, 11000];

export default function Donate() {
  const [form, setForm] = useState({ donor_name: '', donor_email: '', amount: '', purpose: PURPOSES[0], message: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await supabase.from('donations').insert({ ...form, amount: Number(form.amount) });
    setBusy(false);
    if (error) {
      setMsg({ type: 'err', text: 'Could not record your pledge. Please try again or contact the club.' });
    } else {
      setMsg({ type: 'ok', text: 'Thank you! Your pledge is recorded. The club treasurer will contact you with payment details and a receipt.' });
      setForm({ donor_name: '', donor_email: '', amount: '', purpose: PURPOSES[0], message: '' });
    }
  }

  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 980 }}>
        <div className="page-head" style={{ textAlign: 'center', margin: '0 auto 34px' }}>
          <p className="eyebrow" style={{ justifyContent: 'center' }}><Wheel />Support the Work</p>
          <h1>Every rupee becomes work done</h1>
          <p>
            ₹18 Lakh+ went into community service last Rotary year — screenings for 590 women,
            dialysis for 100+ patients, nutrition kits, scholarships and more. Pledge below and
            the club treasurer will reach out to complete the donation and issue a receipt.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 26, alignItems: 'start' }} className="project-layout">
          <div className="card card-pad">
            <h3 style={{ marginBottom: 14 }}>Where donations go</h3>
            <ul style={{ listStyle: 'none', display: 'grid', gap: 12, fontSize: '.93rem', color: 'var(--ink-soft)' }}>
              <li><b style={{ color: 'var(--ink)' }}>₹21 Lakh</b> — mammography camps, 590 women screened</li>
              <li><b style={{ color: 'var(--ink)' }}>₹2 Crore</b> — dialysis machines sponsored (100+ patients served)</li>
              <li><b style={{ color: 'var(--ink)' }}>₹3 Lakh/yr</b> — dialysis program running support</li>
              <li><b style={{ color: 'var(--ink)' }}>50 patients</b> — monthly TB nutrition kits</li>
              <li><b style={{ color: 'var(--ink)' }}>3,100+ students</b> — free mock entrance exams</li>
            </ul>
            <p style={{ marginTop: 18, fontSize: '.84rem', color: 'var(--ink-soft)', borderTop: '1px solid var(--line)', paddingTop: 14 }}>
              This form records a pledge only — no money is collected online. Payment is completed
              directly with the club treasurer, who issues an official receipt.
              Questions? Call <a href="tel:+919825509107">+91 98255 09107</a>.
            </p>
          </div>

          <form className="card card-pad" onSubmit={submit}>
            {msg && <p className={`form-msg ${msg.type}`}>{msg.text}</p>}
            <div className="grid-2">
              <div className="field">
                <label htmlFor="dn">Your name</label>
                <input id="dn" value={form.donor_name} onChange={set('donor_name')} required autoComplete="name" />
              </div>
              <div className="field">
                <label htmlFor="de">Email</label>
                <input id="de" type="email" value={form.donor_email} onChange={set('donor_email')} required autoComplete="email" />
              </div>
            </div>
            <div className="field">
              <label>Amount (₹)</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                {AMOUNTS.map((a) => (
                  <button type="button" key={a}
                    className={`btn btn-sm ${Number(form.amount) === a ? 'btn-gold' : 'btn-ghost'}`}
                    onClick={() => setForm((f) => ({ ...f, amount: String(a) }))}>
                    ₹{a.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
              <input type="number" min="1" step="1" value={form.amount} onChange={set('amount')} required placeholder="Or enter any amount" aria-label="Donation amount in rupees" />
            </div>
            <div className="field">
              <label htmlFor="dp">Purpose</label>
              <select id="dp" value={form.purpose} onChange={set('purpose')}>
                {PURPOSES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="dm">Message (optional)</label>
              <textarea id="dm" rows={3} value={form.message} onChange={set('message')} placeholder="In memory of…, on behalf of…, etc." />
            </div>
            <button className="btn btn-gold" style={{ width: '100%' }} disabled={busy}>
              {busy ? 'Recording…' : 'Pledge this donation'}
            </button>
          </form>
        </div>
      </div>
      <style>{`@media (max-width: 880px){ .project-layout{ grid-template-columns: 1fr !important; } }`}</style>
    </main>
  );
}
