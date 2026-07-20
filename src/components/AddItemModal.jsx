import { useState } from 'react';
import * as api from '../api';

const EMPTY = { name: '', price_type: 'priced', price_amount: '', price_max: '', notes: '', location: '' };

export default function AddItemModal({ onClose, onCreated, toast }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const item = await api.createItem({
        name: form.name.trim(),
        price_type: form.price_type,
        price_amount: form.price_type === 'free' ? null : (form.price_amount !== '' ? Number(form.price_amount) : null),
        price_max: form.price_type === 'free' ? null : (form.price_max !== '' ? Number(form.price_max) : null),
        notes: form.notes.trim() || null,
        location: form.location.trim() || null,
      });
      if (item) { onCreated(item); onClose(); }
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
          <h2>Add Item</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div className="form-group">
            <label>Item name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Solid wood bookshelf"
              autoFocus
              required
            />
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
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price_amount}
                  onChange={(e) => set('price_amount', e.target.value)}
                  placeholder="25"
                />
              </div>
              <div className="form-group">
                <label>Max price ($) <span style={{ fontWeight: 400 }}>optional</span></label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price_max}
                  onChange={(e) => set('price_max', e.target.value)}
                  placeholder="40"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Location <span style={{ fontWeight: 400 }}>optional</span></label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => set('location', e.target.value)}
              placeholder="e.g. Basement, Kitchen, Outside"
            />
          </div>

          <div className="form-group">
            <label>Notes <span style={{ fontWeight: 400 }}>optional</span></label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="e.g. Solid wood, open box, set of 2"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !form.name.trim()}>
              {saving ? 'Adding…' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
