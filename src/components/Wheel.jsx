/** The Rotary gear-wheel mark, drawn once and reused everywhere. */
export default function Wheel({ className = 'wheel' }) {
  const cogs = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <g fill="currentColor">
        {cogs.map((deg) => (
          <rect key={deg} x="56.5" y="8" width="7" height="11" rx="1.5" transform={`rotate(${deg} 60 60)`} />
        ))}
      </g>
      <g fill="none" stroke="currentColor">
        <circle cx="60" cy="60" r="42" strokeWidth="8" />
        <circle cx="60" cy="60" r="14" strokeWidth="7" />
        <g strokeWidth="6.5">
          <path d="M60 46V22M60 74v24M47.9 53 27 41M72.1 67 93 79M47.9 67 27 79M72.1 53 93 41" />
        </g>
      </g>
      <rect x="56.5" y="42" width="7" height="8" rx="1" fill="currentColor" />
    </svg>
  );
}
