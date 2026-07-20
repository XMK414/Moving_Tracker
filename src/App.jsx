import { useState, useEffect, useCallback } from 'react';
import * as api from './api';
import PasscodeGate from './components/PasscodeGate';
import FilterTabs from './components/FilterTabs';
import ItemCard from './components/ItemCard';
import AddItemModal from './components/AddItemModal';
import BulkImportModal from './components/BulkImportModal';
import ClaimModal from './components/ClaimModal';
import EditModal from './components/EditModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import InterestLogModal from './components/InterestLogModal';

let _toastId = 0;

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('mt_token'));
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [claimItem, setClaimItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [interestItem, setInterestItem] = useState(null);

  const [pushState, setPushState] = useState('idle');

  const toast = useCallback((msg, type = 'default') => {
    const id = ++_toastId;
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getItems();
      if (data) setItems(data);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!token) return;
    loadItems();
  }, [token, loadItems]);

  useEffect(() => {
    const logout = () => { setToken(null); setItems([]); };
    window.addEventListener('mt:logout', logout);
    return () => window.removeEventListener('mt:logout', logout);
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushState('unsupported');
    } else if (Notification.permission === 'granted') {
      setPushState('enabled');
    }
  }, []);

  const handleLogin = (t) => {
    localStorage.setItem('mt_token', t);
    setToken(t);
  };

  const onItemCreated = (item) => {
    setItems((prev) => [item, ...prev]);
    toast('Item added!', 'success');
  };

  const onBulkCreated = (newItems) => {
    setItems((prev) => [...newItems, ...prev]);
    toast(`${newItems.length} items imported!`, 'success');
  };

  const onItemUpdated = (updated) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const onItemDeleted = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast('Item deleted.', 'default');
  };

  const handleClaim = async (item, claimData) => {
    try {
      const updated = await api.updateItem({ ...item, ...claimData, status: 'claimed' });
      if (updated) { onItemUpdated(updated); toast('Claimed!', 'success'); }
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleMarkPickedUp = async (item) => {
    try {
      const updated = await api.updateItem({ ...item, status: 'picked_up' });
      if (updated) { onItemUpdated(updated); toast('Marked as picked up.', 'success'); }
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleReset = async (item) => {
    try {
      const updated = await api.updateItem({
        ...item,
        status: 'available',
        claimed_by: null,
        claim_platform: null,
        claim_notes: null,
        reminder_at: null,
        reminder_sent: false,
      });
      if (updated) { onItemUpdated(updated); toast('Reset to available.', 'default'); }
    } catch (e) { toast(e.message, 'error'); }
  };

  const handleEnablePush = async () => {
    if (pushState === 'unsupported') return;
    setPushState('loading');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setPushState('idle'); return; }

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error('VITE_VAPID_PUBLIC_KEY not set');

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await api.subscribePush(sub.toJSON());
      setPushState('enabled');
      toast('Alerts enabled!', 'success');
    } catch (e) {
      setPushState('idle');
      toast('Could not enable alerts: ' + e.message, 'error');
    }
  };

  const now = Date.now();
  const HOUR = 60 * 60 * 1000;

  function isReminderDue(item) {
    return (
      item.status === 'claimed' &&
      item.reminder_at &&
      !item.reminder_sent &&
      new Date(item.reminder_at).getTime() <= now + HOUR
    );
  }

  const sorted = [...items].sort((a, b) => {
    const da = isReminderDue(a) ? 0 : 1;
    const db_ = isReminderDue(b) ? 0 : 1;
    if (da !== db_) return da - db_;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const filtered = sorted.filter((i) => filter === 'all' || i.status === filter);

  const counts = {
    all: items.length,
    available: items.filter((i) => i.status === 'available').length,
    claimed: items.filter((i) => i.status === 'claimed').length,
    picked_up: items.filter((i) => i.status === 'picked_up').length,
  };

  if (!token) return <PasscodeGate onLogin={handleLogin} />;

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <h1>Moving Sale Tracker</h1>
          <div className="header-actions">
            {pushState !== 'enabled' && pushState !== 'unsupported' && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleEnablePush}
                disabled={pushState === 'loading'}
              >
                🔔 {pushState === 'loading' ? 'Setting up…' : 'Enable Alerts'}
              </button>
            )}
            {pushState === 'enabled' && (
              <span className="btn btn-ghost btn-sm" style={{ cursor: 'default', opacity: .7 }}>
                🔔 Alerts On
              </span>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => setBulkOpen(true)}>
              ⬆ Bulk Import
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}>
              + Add
            </button>
          </div>
        </div>
      </header>

      <FilterTabs filter={filter} onChange={setFilter} counts={counts} />

      <main className="main">
        {loading && <div className="loading">Loading…</div>}
        {!loading && filtered.length === 0 && (
          <div className="empty">
            {items.length === 0
              ? <p>No items yet. Add one or use Bulk Import.</p>
              : <p>No {filter.replace('_', ' ')} items.</p>}
          </div>
        )}
        {filtered.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            isDue={isReminderDue(item)}
            onClaim={() => setClaimItem(item)}
            onEdit={() => setEditItem(item)}
            onDelete={() => setDeleteItem(item)}
            onPickedUp={() => handleMarkPickedUp(item)}
            onReset={() => handleReset(item)}
            onLogInterest={() => setInterestItem(item)}
          />
        ))}
      </main>

      {addOpen && <AddItemModal onClose={() => setAddOpen(false)} onCreated={onItemCreated} toast={toast} />}
      {bulkOpen && <BulkImportModal onClose={() => setBulkOpen(false)} onImported={onBulkCreated} toast={toast} />}
      {claimItem && (
        <ClaimModal
          item={claimItem}
          onClose={() => setClaimItem(null)}
          onClaim={(data) => { handleClaim(claimItem, data); setClaimItem(null); }}
        />
      )}
      {editItem && (
        <EditModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onUpdated={(u) => { onItemUpdated(u); setEditItem(null); toast('Saved.', 'success'); }}
          toast={toast}
        />
      )}
      {deleteItem && (
        <DeleteConfirmModal
          item={deleteItem}
          onClose={() => setDeleteItem(null)}
          onDeleted={() => { onItemDeleted(deleteItem.id); setDeleteItem(null); }}
          toast={toast}
        />
      )}
      {interestItem && (
        <InterestLogModal
          item={interestItem}
          onClose={() => setInterestItem(null)}
          toast={toast}
        />
      )}

      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </>
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
}
