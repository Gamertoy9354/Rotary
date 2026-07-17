import Wheel from './Wheel';

export default function Spinner() {
  return (
    <div className="spinner" role="status" aria-label="Loading">
      <Wheel />
    </div>
  );
}

export function Empty({ children }) {
  return (
    <div className="empty">
      <Wheel />
      <p>{children}</p>
    </div>
  );
}
