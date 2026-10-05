import StatusBadge from './StatusBadge';
import { fmt, duration, visitLabel } from '../utils/helpers';

export default function VisitTable({ visits, onCheckOut, onCheckIn, showDuration }) {
  if (!visits.length) return <p style={{ color: '#6b7280' }}>No visits found.</p>;

  const hasActions = onCheckOut || onCheckIn;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Badge</th><th>Visitor</th><th>Company</th><th>Host</th><th>Purpose</th>
            <th>Check-in</th><th>Check-out</th>
            {showDuration && <th>Time on site</th>}
            <th>Status</th>
            {hasActions && <th></th>}
          </tr>
        </thead>
        <tbody>
          {visits.map((v) => {
            const tooLong =
              showDuration && Date.now() - new Date(v.checkInTime) > 4 * 3600 * 1000;
            return (
              <tr key={v._id} className={tooLong ? 'warn' : ''}>
                <td>{v.badgeNumber || '—'}</td>
                <td>{v.visitor?.name || '—'}</td>
                <td>{v.visitor?.company || '—'}</td>
                <td>{v.host?.name || '—'}</td>
                <td>{v.purpose}</td>
                <td>{fmt(v.checkInTime)}</td>
                <td>{fmt(v.checkOutTime)}</td>
                {showDuration && <td>{duration(v.checkInTime)}</td>}
                <td><StatusBadge status={visitLabel(v)} /></td>
                {hasActions && (
                  <td>
                    {v.status === 'checked-in' && onCheckOut && (
                      <button className="btn small" onClick={() => onCheckOut(v._id)}>
                        Check out
                      </button>
                    )}
                    {v.status === 'pre-registered' && onCheckIn && (
                      <button className="btn secondary small" onClick={() => onCheckIn(v._id)}>
                        Check in anyway
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}