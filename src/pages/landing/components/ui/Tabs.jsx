export default function Tabs({ items, value, onChange }) {
  return (
    <div className="lp-tabs" role="tablist" aria-label="Resource types">
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`lp-tab ${active ? "is-active" : ""}`}
            onClick={() => onChange(it.value)}
          >
            <span className="lp-tab__icon" aria-hidden="true">
              {it.icon}
            </span>
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
