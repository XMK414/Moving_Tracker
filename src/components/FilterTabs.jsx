const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'available', label: 'Available' },
  { key: 'claimed',   label: 'Claimed' },
  { key: 'picked_up', label: 'Picked Up' },
];

export default function FilterTabs({ filter, onChange, counts }) {
  return (
    <div className="filter-bar">
      <div className="filter-inner">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            className={`filter-pill${filter === key ? ' active' : ''}`}
            onClick={() => onChange(key)}
          >
            {label}
            <span className="count">{counts[key] ?? 0}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
