const call = async (path, opts = {}) => {
  const token = localStorage.getItem('mt_token');
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('mt_token');
    window.dispatchEvent(new Event('mt:logout'));
    return null;
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return res.json();
};

export const login = (passcode) =>
  call('/api/auth', { method: 'POST', body: JSON.stringify({ passcode }) });

export const getItems = () => call('/api/items');

export const createItem = (item) =>
  call('/api/items', { method: 'POST', body: JSON.stringify(item) });

export const bulkCreate = (items) =>
  call('/api/items?action=bulk', { method: 'POST', body: JSON.stringify({ items }) });

export const updateItem = (item) =>
  call('/api/items', { method: 'PUT', body: JSON.stringify(item) });

export const deleteItem = (id) =>
  call('/api/items', { method: 'DELETE', body: JSON.stringify({ id }) });

export const getInterests = (itemId) =>
  call(`/api/interests?item_id=${itemId}`);

export const createInterest = (interest) =>
  call('/api/interests', { method: 'POST', body: JSON.stringify(interest) });

export const updateInterest = (interest) =>
  call('/api/interests', { method: 'PUT', body: JSON.stringify(interest) });

export const deleteInterest = (id) =>
  call('/api/interests', { method: 'DELETE', body: JSON.stringify({ id }) });

export const subscribePush = (subscription) =>
  call('/api/push-subscribe', { method: 'POST', body: JSON.stringify({ subscription }) });

export const unsubscribePush = (endpoint) =>
  call('/api/push-subscribe', { method: 'DELETE', body: JSON.stringify({ endpoint }) });
