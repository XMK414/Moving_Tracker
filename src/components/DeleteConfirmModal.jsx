import { useState } from 'react';
import * as api from '../api';

export default function DeleteConfirmModal({ item, onClose, onDeleted, toast }) {
  const [deleting, setDeleting] = useState(false);
  const count = item.interest_count ?? 0;

  const confirm = async () => {
    setDeleting(true);
    try {
      await api.deleteItem(item.id);
      onDeleted();
    } catch (e) {
      toast(e.message, 'error');
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-header">
          <h2>Delete item?</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <p style={{ fontSize: 14.5, lineHeight: 1.5 }}>
          <strong>Delete "{item.name}"</strong>
          {count > 0 ? (
            <> and its <strong>{count} logged conversation{count !== 1 ? 's' : ''}</strong>? This can't be undone.</>
          ) : (
            <>? This can't be undone.</>
          )}
        </p>

        <div className="form-actions">
          <button className="btn btn-outline" onClick={onClose} disabled={deleting}>Cancel</button>
          <button className="btn btn-danger" onClick={confirm} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
