import { useState } from 'react';

const PLATFORMS = [
  { value: '', label: '— select platform —' },
  { value: 'nextdoor', label: 'Nextdoor' },
  { value: 'facebook_marketplace', label: 'FB Marketplace' },
  { value: 'offerup', label: 'OfferUp' },
  { value: 'craigslist', label: 'Craigslist' },
  { value: 'other', label: 'Other' },
];

export default function ClaimModal({ item, onClose, onClaim }) {
  const [form, setForm] = useState({
    claimed_by: '',
    claim_platform: '',
    claim_notes: '',
    reminder_at: '',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.claimed_by.trim()) return;
    onClaim({
      claimed_by: form.claimed_by.trim(),
      claim_platform: form.claim_platform || null,
      claim_notes: form.claim_notes.trim() || null,
      reminder_at: form.reminder_at || null,
      reminder_sent: false,
    });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Claim — {item.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div className="form-group">
            <label>Claimed by *</label>
            <input
              type="text"
              value={form.claimed_by}
              onChange={(e) => set('claimed_by', e.target.value)}
              placeholder="Name of person"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label>Platform (where the DM came from)</label>
            <select value={form.claim_platform} onChange={(e) => set('claim_platform', e.target.value)}>
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Notes <span style={{ fontWeight: 400 }}>optional</span></label>
            <textarea
              value={form.claim_notes}
              onChange={(e) => set('claim_notes', e.target.value)}
              placeholder="Pickup time, payment method, agreed price, etc."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Follow-up reminder <span style={{ fontWeight: 400 }}>optional</span></label>
            <input
              type="datetime-local"
              value={form.reminder_at}
              onChange={(e) => set('reminder_at', e.target.value)}
            />
            <span className="form-hint">You'll get a push alert (if enabled) when this time arrives.</span>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-amber" disabled={!form.claimed_by.trim()}>
              Mark as Claimed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
