export default function Pill({ children, className = "" }) {
  return <span className={`lp-pill ${className}`}>{children}</span>;
}
