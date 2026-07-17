import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Wheel from '../components/Wheel';

export default function Login() {
  const [mode, setMode] = useState('signin'); // signin | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [msg, setMsg] = useState(null); // {type,text}
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dest = location.state?.from || '/dashboard';

  async function signInWithGoogle() {
    setBusy(true); setMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    // On success the browser redirects to Google; we only land here on failure.
    if (error) {
      setMsg({ type: 'err', text: error.message || 'Google sign-in is not available right now.' });
      setBusy(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        if (data.session) navigate(dest, { replace: true });
        else setMsg({ type: 'ok', text: 'Account created. Check your email for a confirmation link, then sign in.' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate(dest, { replace: true });
      }
    } catch (err) {
      setMsg({ type: 'err', text: err.message || 'Something went wrong. Please try again.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <Wheel className="login-wheel" />
          <h1 style={{ fontSize: '1.7rem', marginTop: 10 }}>
            {mode === 'signin' ? 'Welcome back' : 'Join the community'}
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: '.94rem' }}>
            {mode === 'signin'
              ? 'Sign in with the email associated with your profile.'
              : 'Club members: use the email the club has on file and your role unlocks automatically.'}
          </p>
        </div>

        <div className="card card-pad" style={{ marginBottom: 18 }}>
          <button type="button" className="btn btn-outline" style={{ width: '100%' }} onClick={signInWithGoogle} disabled={busy}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Continue with Google
          </button>
          <p style={{ textAlign: 'center', fontSize: '.8rem', color: 'var(--ink-soft)', marginTop: 10 }}>
            Club members: sign in with the Google account of the email the club has on file
            and your member role unlocks automatically.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 18px', color: 'var(--ink-soft)', fontSize: '.78rem', letterSpacing: '.12em', textTransform: 'uppercase' }} aria-hidden="true">
          <span style={{ flex: 1, borderTop: '1px solid var(--line)' }} />
          or with email
          <span style={{ flex: 1, borderTop: '1px solid var(--line)' }} />
        </div>

        <form className="card card-pad" onSubmit={submit}>
          {msg && <p className={`form-msg ${msg.type}`}>{msg.text}</p>}
          {mode === 'signup' && (
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
          </div>
          <button className="btn btn-blue" style={{ width: '100%' }} disabled={busy}>
            {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: '.9rem' }}>
            {mode === 'signin' ? (
              <>New here? <a href="#signup" onClick={(e) => { e.preventDefault(); setMode('signup'); setMsg(null); }}>Create an account</a></>
            ) : (
              <>Already registered? <a href="#signin" onClick={(e) => { e.preventDefault(); setMode('signin'); setMsg(null); }}>Sign in</a></>
            )}
          </p>
        </form>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: '.86rem', color: 'var(--ink-soft)' }}>
          Anyone can join as a community supporter — to like, comment and follow the club's work.{' '}
          <Link to="/community">See who's here already.</Link>
        </p>
      </div>
    </main>
  );
}
