import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Wheel from './Wheel';
import Avatar from './Avatar';

export default function Layout() {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Link to="/" className="nav-brand" onClick={close}>
            <Wheel />
            <span>
              <b>Rotary Club of Bardoli</b>
              <small>Community Platform · District 3060</small>
            </span>
          </Link>
          <nav className={`nav-links ${open ? 'open' : ''}`} aria-label="Primary">
            <NavLink to="/" end onClick={close}>Home</NavLink>
            <NavLink to="/projects" onClick={close}>Projects</NavLink>
            <NavLink to="/community" onClick={close}>Community</NavLink>
            <NavLink to="/gallery" onClick={close}>Gallery</NavLink>
            <NavLink to="/feed" onClick={close}>Feed</NavLink>
            <NavLink to="/help" onClick={close}>Request Help</NavLink>
            <NavLink to="/donate" onClick={close}>Donate</NavLink>
            {user ? (
              <>
                <NavLink to="/dashboard" onClick={close}>Dashboard</NavLink>
                <a
                  href="#signout"
                  onClick={(e) => { e.preventDefault(); close(); signOut().then(() => navigate('/')); }}
                >
                  Sign out
                </a>
              </>
            ) : (
              <NavLink to="/login" onClick={close}>Sign in</NavLink>
            )}
          </nav>
          <div className="nav-auth">
            {user && profile && (
              <Link to="/dashboard" aria-label="Your dashboard">
                <Avatar profile={profile} size={38} />
              </Link>
            )}
            <button
              className={`nav-burger ${open ? 'open' : ''}`}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      <Outlet />

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <Wheel />
            <p>
              <b>Rotary Club of Bardoli</b><br />
              Chartered 1961 · District 3060 · Club ID 15148
            </p>
          </div>
          <p className="footer-motto">&ldquo;Service Above Self&rdquo;</p>
        </div>
        <div className="footer-bar container">
          © {new Date().getFullYear()} Rotary Club of Bardoli · Contact: +91 98255 09107
        </div>
      </footer>
    </>
  );
}
