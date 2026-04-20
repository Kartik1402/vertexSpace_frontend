export default function Button({
  children,
  variant = "primary", // primary | ghost | dark | light
  size = "md", // md | lg
  className = "",
  ...props
}) {
  return (
    <button
      type="button"
      className={`lp-btn lp-btn--${variant} lp-btn--${size} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
