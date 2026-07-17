import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import Home from './pages/Home';
import Login from './pages/Login';
import Feed from './pages/Feed';
import PostDetail from './pages/PostDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Community from './pages/Community';
import GroupDetail from './pages/GroupDetail';
import Profile from './pages/Profile';
import Help from './pages/Help';
import Donate from './pages/Donate';
import Dashboard from './pages/Dashboard';
import { Empty } from './components/Spinner';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="feed" element={<Feed />} />
            <Route path="post/:id" element={<PostDetail />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:slug" element={<ProjectDetail />} />
            <Route path="community" element={<Community />} />
            <Route path="groups/:slug" element={<GroupDetail />} />
            <Route path="u/:id" element={<Profile />} />
            <Route path="help" element={<Help />} />
            <Route path="donate" element={<Donate />} />
            <Route path="dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="*" element={<main className="page"><div className="container"><Empty>Page not found.</Empty></div></main>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
