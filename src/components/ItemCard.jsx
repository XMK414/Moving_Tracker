const PLATFORM_LABELS = {
  nextdoor: 'Nextdoor',
  facebook_marketplace: 'FB Marketplace',
  offerup: 'OfferUp',
  craigslist: 'Craigslist',
  other: 'Other',
};

function fmtPrice(item) {
  if (item.price_type === 'free') return 'Free / Donation';
  if (item.price_amount != null && item.price_max != null) {
    return `$${item.price_amount}–$${item.price_max}`;
  }
  if (item.price_amount != null) return `$${item.price_amount}`;
  return '—';
}

function fmtReminder(reminder_at) {
  const d = new Date(reminder_at);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function ItemCard({
  item,
  isDue,
  onClaim,
  onEdit,
  onDelete,
  onPickedUp,
  onReset,
  onLogInterest,
}) {
  const now = Date.now();
  const isOverdue = item.reminder_at && new Date(item.reminder_at).getTime() < now;

  return (
    <div className={`item-card${isDue ? ' reminder-due' : ''}`}>
      <div className="item-top">
        <span className="item-name">{item.name}</span>
        <span className={`item-price${item.price_type === 'free' ? ' price-free' : ''}`}>
          {fmtPrice(item)}
        </span>
      </div>

      <div className="item-meta">
        {item.location && (
          <span className="meta-tag">📍 {item.location}</span>
        )}
        <span className={`status-badge status-${item.status}`}>
          {item.status === 'available' ? 'Available'
            : item.status === 'claimed' ? 'Claimed'
            : 'Picked Up'}
        </span>
        {isDue && (
          <span className={`reminder-badge${isOverdue ? ' overdue' : ''}`}>
            🔔 {isOverdue ? 'Overdue' : 'Due soon'}: {fmtReminder(item.reminder_at)}
          </span>
        )}
        {item.notes && (
          <span className="meta-tag" style={{ fontStyle: 'italic' }}>{item.notes}</span>
        )}
      </div>

      {(item.status === 'claimed' || item.status === 'picked_up') && item.claimed_by && (
        <div className="item-claim-info">
          <span><span className="claim-label">Claimed by:</span> {item.claimed_by}
            {item.claim_platform && ` · ${PLATFORM_LABELS[item.claim_platform] || item.claim_platform}`}
          </span>
          {item.claim_notes && <span>{item.claim_notes}</span>}
          {item.reminder_at && !isDue && (
            <span>⏰ Reminder: {fmtReminder(item.reminder_at)}</span>
          )}
        </div>
      )}

      {item.interest_count > 0 && (
        <button className="interest-count-link" onClick={onLogInterest}>
          {item.interest_count} {item.interest_count === 1 ? 'person' : 'people'} interested
        </button>
      )}

      <div className="item-actions">
        {item.status === 'available' && (
          <button className="btn btn-amber btn-sm" onClick={onClaim}>Claim</button>
        )}
        {item.status === 'claimed' && (
          <button className="btn btn-primary btn-sm" onClick={onPickedUp}>Picked Up ✓</button>
        )}
        {(item.status === 'claimed' || item.status === 'picked_up') && (
          <button className="btn btn-outline btn-sm" onClick={onReset}>↩ Reset</button>
        )}
        <button className="btn btn-outline btn-sm" onClick={onLogInterest}>
          + Log Interest{item.interest_count > 0 ? ` (${item.interest_count})` : ''}
        </button>
        <button className="btn btn-outline btn-sm" onClick={onEdit}>Edit</button>
        <button className="btn btn-outline btn-sm" style={{ color: 'var(--red)', borderColor: 'var(--red)' }} onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}
