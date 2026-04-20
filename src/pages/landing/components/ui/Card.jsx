export default function Card({ children, className = "" }) {
  return <div className={`lp-card ${className}`}>{children}</div>;
}
