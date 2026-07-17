import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ProjectCard from '../components/ProjectCard';
import Spinner, { Empty } from '../components/Spinner';
import Wheel from '../components/Wheel';

const FILTERS = ['All', 'Ongoing', 'Planning', 'Completed'];

export default function Projects() {
  const [projects, setProjects] = useState(null);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    supabase
      .from('projects')
      .select('*, lead_group_info:groups(id, name, slug)')
      .order('status', { ascending: true })
      .order('created_at', { ascending: true })
      .then(({ data }) => setProjects(data ?? []));
  }, []);

  const visible = projects?.filter((p) => filter === 'All' || p.status === filter.toLowerCase());

  return (
    <main className="page">
      <div className="container">
        <div className="page-head">
          <p className="eyebrow"><Wheel />Our Projects</p>
          <h1>The work, in the open</h1>
          <p>
            Every project the club runs — who leads it, what it has achieved, and how it's going.
            Visitors are welcome to follow along; members can join a project team from its page.
          </p>
        </div>
        <div className="tabs" role="tablist" aria-label="Filter projects">
          {FILTERS.map((f) => (
            <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)} role="tab" aria-selected={filter === f}>
              {f}
            </button>
          ))}
        </div>
        {projects === null ? <Spinner /> : visible.length === 0 ? (
          <Empty>No {filter.toLowerCase()} projects right now.</Empty>
        ) : (
          <div className="grid-3">
            {visible.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </div>
    </main>
  );
}
