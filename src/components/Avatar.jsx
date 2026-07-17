export default function Avatar({ profile, name, size = 42 }) {
  const displayName = profile?.full_name || name || '?';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {profile?.avatar_url ? <img src={profile.avatar_url} alt={displayName} /> : initials}
    </span>
  );
}
