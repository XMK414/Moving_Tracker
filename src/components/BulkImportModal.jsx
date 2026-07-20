import { useState } from 'react';
import * as api from '../api';

function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(' - ');
  if (parts.length < 2) return { _error: true, raw: trimmed, reason: 'Missing price — use "Name - $price"' };

  const name = parts[0].trim();
  if (!name) return { _error: true, raw: trimmed, reason: 'Missing name' };

  const priceStr = parts[1].trim();
  const location = parts[2]?.trim() || '';
  const notes = parts[3]?.trim() || '';

  let price_type = 'priced';
  let price_amount = null;
  let price_max = null;

  const lower = priceStr.toLowerCase();
  if (lower === 'free' || lower === 'donation') {
    price_type = 'free';
  } else {
    const rangeM = priceStr.match(/\$?(\d+(?:\.\d+)?)\s*[-–]\s*\$?(\d+(?:\.\d+)?)/)
    if (rangeM) {
      price_amount = parseFloat(rangeM[1]);
      price_max = parseFloat(rangeM[2]);
    } else {
      const singleM = priceStr.match(/\$?(\d+(?:\.\d+)?)/);
      if (singleM) {
        price_amount = parseFloat(singleM[1]);
      } else {
        return { _error: true, raw: trimmed, reason: `Can't parse price: "${priceStr}"` };
      }
    }
  }

  return { name, price_type, price_amount, price_max, location: location || null, notes: notes || null };
}

function fmtPreviewPrice(row) {
  if (row.price_type === 'free') return 'Free';
  if (row.price_amount != null && row.price_max != null) return `$${row.price_amount}–$${row.price_max}`;
  if (row.price_amount != null) return `$${row.price_amount}`;
  return '—';
}

export default function BulkImportModal({ onClose, onImported, toast }) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const handlePreview = () => {
    const lines = text.split('\n').filter((l) => l.trim());
    const parsed = lines.map(parseLine).filter(Boolean);
    setPreview(parsed);
  };

  const goodRows = preview?.filter((r) => !r._error) ?? [];
  const badRows  = preview?.filter((r) => r._error) ?? [];

  const handleImport = async () => {
    if (goodRows.length === 0) return;
    setSaving(true);
    try {
      const items = await api.bulkCreate(goodRows);
      if (items) { onImported(items); onClose(); }
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
          <h2>Bulk Import</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <p className="form-hint">
          One item per line: <strong>Name - $price</strong> (optional: <strong>- Location - Notes</strong>)<br />
          Prices: <code>$70</code> · <code>$60-$80</code> · <code>Free</code> · <code>Donation</code>
        </p>

        {!preview ? (
          <>
            <div className="form-group">
              <label>Paste your list</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={'55" Flat Screen TV - $70\nRefrigerator - $150 - Kitchen\nOld Desk - $60-$80 - Basement - Solid wood\nMiscellaneous Box - Free'}
                rows={10}
                autoFocus
              />
            </div>
            <div className="form-actions">
              <button className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handlePreview}
                disabled={!text.trim()}
              >
                Preview →
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>
                {goodRows.length} item{goodRows.length !== 1 ? 's' : ''} ready to import
                {badRows.length > 0 && ` · ${badRows.length} will be skipped`}
              </p>
              <div className="bulk-preview">
                {goodRows.map((r, i) => (
                  <div key={i} className="bulk-row">
                    <span>{r.name}{r.location ? ` · ${r.location}` : ''}{r.notes ? ` · ${r.notes}` : ''}</span>
                    <span className="bulk-price">{fmtPreviewPrice(r)}</span>
                  </div>
                ))}
                {badRows.map((r, i) => (
                  <div key={`e${i}`} className="bulk-row error">
                    ⚠ {r.raw} — {r.reason}
                  </div>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setPreview(null)} disabled={saving}>
                ← Edit
              </button>
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={saving || goodRows.length === 0}
              >
                {saving ? 'Importing…' : `Import ${goodRows.length} item${goodRows.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
