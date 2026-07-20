import { useState } from 'react';
import * as api from '../api';

const PLATFORMS = [
  { value: '', label: '— none —' },
  { value: 'nextdoor', label: 'Nextdoor' },
  { value: 'facebook_marketplace', label: 'FB Marketplace' },
  { value: 'offerup', label: 'OfferUp' },
  { value: 'craigslist', label: 'Craigslist' },
  { value: 'other', label: 'Other' },
];

function toDatetimeLocal(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditModal({ item, onClose, onUpdated, toast }) {
  const [form, setForm] = useState({
    name: item.name || '',
    price_type: item.price_type || 'priced',
    price_amount: item.price_amount ?? '',
    price_max: item.price_max ?? '',
    notes: item.notes || '',
    location: item.location || '',
    status: item.status || 'available',
    claimed_by: item.claimed_by || '',
    claim_platform: item.claim_platform || '',
    claim_notes: item.claim_notes || '',
    reminder_at: toDatetimeLocal(item.reminder_at),
    reminder_sent: item.reminder_sent ?? false,
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const updated = await api.updateItem({
        id: item.id,
        name: form.name.trim(),
        price_type: form.price_type,
        price_amount: form.price_type === 'free' ? null : (form.price_amount !== '' ? Number(form.price_amount) : null),
        price_max: form.price_type === 'free' ? null : (form.price_max !== '' ? Number(form.price_max) : null),
        notes: form.notes.trim() || null,
        location: form.location.trim() || null,
        status: form.status,
        claimed_by: form.claimed_by.trim() || null,
        claim_platform: form.claim_platform || null,
        claim_notes: form.claim_notes.trim() || null,
        reminder_at: form.reminder_at || null,
        reminder_sent: form.reminder_sent,
      });
      if (updated) onUpdated(updated);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Edit Item</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div className="form-group">
            <label>Item name *</label>
            <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} required autoFocus />
          </div>

          <div className="form-group">
            <label>Price</label>
            <div className="price-toggle">
              <button type="button" className={form.price_type === 'priced' ? 'active' : ''} onClick={() => set('price_type', 'priced')}>
                $ Priced
              </button>
              <button type="button" className={form.price_type === 'free' ? 'active' : ''} onClick={() => set('price_type', 'free')}>
                Free / Donation
              </button>
            </div>
          </div>

          {form.price_type === 'priced' && (
            <div className="input-row">
              <div className="form-group">
                <label>Price ($)</label>
                <input type="number" min="0" step="0.01" value={form.price_amount} onChange={(e) => set('price_amount', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Max price ($)</label>
                <input type="number" min="0" step="0.01" value={form.price_max} onChange={(e) => set('price_max', e.target.value)} />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Location</label>
            <input type="text" value={form.location} onChange={(e) => set('location', e.target.value)} />
          </div>

          <div className="form-group">
            <label>Notes</label>
            <input type="text" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="available">Available</option>
              <option value="claimed">Claimed</option>
              <option value="picked_up">Picked Up</option>
            </select>
          </div>

          {(form.status === 'claimed' || form.status === 'picked_up') && (
            <>
              <div className="form-group">
                <label>Claimed by</label>
                <input type="text" value={form.claimed_by} onChange={(e) => set('claimed_by', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Platform</label>
                <select value={form.claim_platform} onChange={(e) => set('claim_platform', e.target.value)}>
                  {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Claim notes</label>
                <textarea value={form.claim_notes} onChange={(e) => set('claim_notes', e.target.value)} rows={2} />
              </div>
              <div className="form-group">
                <label>Follow-up reminder</label>
                <input type="datetime-local" value={form.reminder_at} onChange={(e) => set('reminder_at', e.target.value)} />
              </div>
            </>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
