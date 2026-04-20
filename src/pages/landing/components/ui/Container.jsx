export default function Container({ children, className = "" }) {
  return <div className={`lp-container ${className}`}>{children}</div>;
}
