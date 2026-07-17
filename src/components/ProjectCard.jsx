import { Link } from 'react-router-dom';
import Wheel from './Wheel';

const STATUS_BADGE = { planning: 'badge', ongoing: 'badge-green badge', completed: 'badge-gold badge' };
export const STATUS_LABEL = { planning: 'Planning', ongoing: 'Ongoing', completed: 'Completed' };

export default function ProjectCard({ project }) {
  return (
    <article className="card pcard">
      <Link to={`/projects/${project.slug}`} className="pcard-cover" aria-hidden="true" tabIndex={-1}>
        {project.cover_url ? <img src={project.cover_url} alt="" loading="lazy" /> : <Wheel />}
      </Link>
      <div className="pcard-body">
        <div className="pcard-meta">
          <span className={STATUS_BADGE[project.status] || 'badge'}>{STATUS_LABEL[project.status] || project.status}</span>
          <span className="badge">{project.category}</span>
        </div>
        <h3><Link to={`/projects/${project.slug}`}>{project.title}</Link></h3>
        <p>{project.summary}</p>
        {project.impact && <span className="pcard-impact">✦ {project.impact}</span>}
        {project.lead_group_info && (
          <span style={{ fontSize: '.82rem', color: 'var(--ink-soft)' }}>
            Led by <Link to={`/groups/${project.lead_group_info.slug}`}>{project.lead_group_info.name}</Link>
          </span>
        )}
      </div>
    </article>
  );
}
