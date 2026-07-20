import { useState, useEffect } from 'react';
import * as api from '../api';

const PLATFORMS = [
  { value: '', label: '— select —' },
  { value: 'nextdoor', label: 'Nextdoor' },
  { value: 'facebook_marketplace', label: 'FB Marketplace' },
  { value: 'offerup', label: 'OfferUp' },
  { value: 'craigslist', label: 'Craigslist' },
  { value: 'other', label: 'Other' },
];

const STATUS_LABELS = {
  interested: 'Interested',
  went_quiet: 'Went Quiet',
  declined: 'Declined',
};

const EMPTY_FORM = { name: '', platform: '', notes: '' };

export default function InterestLogModal({ item, onClose, toast }) {
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getInterests(item.id);
        if (data) setInterests(data);
      } catch (e) {
        toast(e.message, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [item.id, toast]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const entry = await api.createInterest({
        item_id: item.id,
        name: form.name.trim(),
        platform: form.platform || null,
        notes: form.notes.trim() || null,
      });
      if (entry) {
        setInterests((prev) => [entry, ...prev]);
        setForm(EMPTY_FORM);
        toast('Logged!', 'success');
      }
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (entry) => {
    setEditingId(entry.id);
    setEditForm({ name: entry.name, platform: entry.platform || '', notes: entry.notes || '', status: entry.status });
  };

  const saveEdit = async (id) => {
    try {
      const updated = await api.updateInterest({
        id,
        name: editForm.name.trim(),
        platform: editForm.platform || null,
        notes: editForm.notes.trim() || null,
        status: editForm.status,
      });
      if (updated) {
        setInterests((prev) => prev.map((e) => (e.id === id ? updated : e)));
        setEditingId(null);
      }
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this interest entry?')) return;
    try {
      await api.deleteInterest(id);
      setInterests((prev) => prev.filter((e) => e.id !== id));
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Interest Log — {item.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {loading && <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</p>}

        {!loading && interests.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No one logged yet. Use the form below.</p>
        )}

        {interests.length > 0 && (
          <div className="interest-list">
            {interests.map((entry) =>
              editingId === entry.id ? (
                <div key={entry.id} className="interest-entry" style={{ background: '#f9f9f9' }}>
                  <div className="form-group" style={{ gap: 4 }}>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      style={{ fontSize: 13 }}
                    />
                  </div>
                  <div className="input-row" style={{ gap: 6 }}>
                    <select
                      value={editForm.platform}
                      onChange={(e) => setEditForm((f) => ({ ...f, platform: e.target.value }))}
                      style={{ fontSize: 12.5 }}
                    >
                      {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                      style={{ fontSize: 12.5 }}
                    >
                      <option value="interested">Interested</option>
                      <option value="went_quiet">Went Quiet</option>
                      <option value="declined">Declined</option>
                    </select>
                  </div>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    style={{ fontSize: 12.5 }}
                  />
                  <div className="interest-actions">
                    <button className="btn btn-primary btn-xs" onClick={() => saveEdit(entry.id)}>Save</button>
                    <button className="btn btn-outline btn-xs" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div key={entry.id} className="interest-entry">
                  <div className="interest-top">
                    <span className="interest-name">{entry.name}</span>
                    <span className={`interest-status status-${entry.status}`}>
                      {STATUS_LABELS[entry.status]}
                    </span>
                  </div>
                  {entry.platform && (
                    <span className="interest-platform">
                      via {PLATFORMS.find((p) => p.value === entry.platform)?.label || entry.platform}
                    </span>
                  )}
                  {entry.notes && <span className="interest-notes">{entry.notes}</span>}
                  <div className="interest-actions">
                    <button className="btn btn-outline btn-xs" onClick={() => startEdit(entry)}>Edit</button>
                    <button
                      className="btn btn-xs"
                      style={{ color: 'var(--red)', border: '1px solid var(--red)', borderRadius: 'var(--r)', background: 'none' }}
                      onClick={() => handleDelete(entry.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        <hr className="divider" />

        <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontWeight: 700, fontSize: 13.5 }}>+ Log someone new</p>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Who asked about this?"
            />
          </div>
          <div className="input-row">
            <div className="form-group">
              <label>Platform</label>
              <select value={form.platform} onChange={(e) => set('platform', e.target.value)}>
                {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Notes <span style={{ fontWeight: 400 }}>optional</span></label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Price they offered, what they said, etc."
              rows={2}
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Close</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !form.name.trim()}>
              {saving ? 'Logging…' : 'Log Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
