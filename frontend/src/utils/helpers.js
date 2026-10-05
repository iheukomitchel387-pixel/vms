export const getUser = () => JSON.parse(localStorage.getItem('user') || 'null');

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const errMsg = (err) =>
  err.response?.data?.errors?.[0]?.message ||
  err.response?.data?.message ||
  'Something went wrong';

export const fmt = (d) =>
  d ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export const duration = (from, to = new Date()) => {
  if (!from) return '—';
  const mins = Math.max(0, Math.floor((new Date(to) - new Date(from)) / 60000));
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

export const filterVisits = (visits, q) => {
  const s = q.trim().toLowerCase();
  if (!s) return visits;
  return visits.filter((v) =>
    [v.visitor?.name, v.visitor?.company, v.host?.name, v.purpose, v.badgeNumber].some((x) =>
      (x || '').toLowerCase().includes(s)
    )
  );
};

export const visitLabel = (v) => {
  if (v.status === 'pre-registered' && v.approval === 'pending') return 'awaiting-host';
  if (v.status === 'cancelled' && v.approval === 'declined') return 'declined';
  return v.status;
};