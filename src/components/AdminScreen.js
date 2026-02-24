import React, { useState, useEffect } from 'react';
import { Flag, Users, BookOpen, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getAdminData, resolveReport } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { SkillCardSkeleton } from './Skeleton';
import ErrorBanner from './ErrorBanner';

// Only these UIDs can access the admin panel
const ADMIN_UIDS = [
  // Add your Firebase UID here
];

function AdminScreen({ onNavigate }) {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resolving, setResolving] = useState(null);

  const isAdmin = ADMIN_UIDS.includes(currentUser?.uid) || process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getAdminData();
        setReports(data.reports || []);
        setStats(data.stats || {});
      } catch (err) {
        console.error('Admin load error:', err);
        setError('Could not load admin data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAdmin]);

  const handleResolve = async (reportId, action) => {
    setResolving(reportId);
    await resolveReport(reportId, action);
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: action } : r));
    setResolving(null);
  };

  const formatTime = (createdAt) => {
    if (!createdAt) return '';
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!isAdmin) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '80px', color: 'white' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>🚫</div>
        <h2 style={{ fontSize: '22px', fontWeight: '700' }}>Access Denied</h2>
        <p style={{ color: '#8b8fa8', marginTop: '8px' }}>You don't have admin access.</p>
      </div>
    );
  }

  const pendingReports = reports.filter(r => r.status === 'pending');
  const resolvedReports = reports.filter(r => r.status !== 'pending');

  return (
    <div className="fade-in" style={{ paddingTop: '20px', paddingBottom: '20px' }}>

      {/* Header */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #7c6af7 0%, #9c59f5 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Flag size={20} style={{ color: 'white' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f0f0f5' }}>Admin Panel</h2>
            <p style={{ fontSize: '13px', color: '#8b8fa8' }}>Skillette dashboard</p>
          </div>
        </div>

        {/* Stats row */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { label: 'Users', value: stats.totalUsers ?? '—', icon: <Users size={16} />, color: '#7c6af7' },
              { label: 'Skills', value: stats.totalSkills ?? '—', icon: <BookOpen size={16} />, color: '#4facfe' },
              { label: 'Reports', value: pendingReports.length, icon: <Flag size={16} />, color: '#f5576c' },
            ].map(s => (
              <div key={s.label} style={{
                background: '#252838', borderRadius: '12px', padding: '12px',
                textAlign: 'center', border: '1px solid rgba(255,255,255,0.07)'
              }}>
                <div style={{ color: s.color, marginBottom: '6px', display: 'flex', justifyContent: 'center' }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#f0f0f5' }}>{s.value}</div>
                <div style={{ fontSize: '11px', color: '#8b8fa8', fontWeight: '600' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[
          { id: 'reports', label: `Pending (${pendingReports.length})` },
          { id: 'resolved', label: 'Resolved' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
              cursor: 'pointer', fontSize: '14px', fontWeight: '600',
              background: tab === t.id ? 'linear-gradient(135deg, #7c6af7 0%, #9c59f5 100%)' : '#252838',
              color: tab === t.id ? 'white' : '#8b8fa8',
              transition: 'all 0.2s ease'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {error && <ErrorBanner message={error} />}

      {loading ? (
        <>
          <SkillCardSkeleton />
          <SkillCardSkeleton />
          <SkillCardSkeleton />
        </>
      ) : (tab === 'reports' ? pendingReports : resolvedReports).length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: '48px', color: '#8b8fa8' }}>
          <CheckCircle size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
          <p style={{ fontSize: '16px' }}>
            {tab === 'reports' ? 'No pending reports 🎉' : 'No resolved reports yet'}
          </p>
        </div>
      ) : (
        <div className="stagger-children">
          {(tab === 'reports' ? pendingReports : resolvedReports).map(report => (
            <div key={report.id} className="card" style={{ marginBottom: '12px' }}>
              {/* Report header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Flag size={14} style={{ color: '#f5576c' }} />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#f5576c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {report.type} report
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#555870', fontSize: '12px' }}>
                  <Clock size={12} />
                  {formatTime(report.createdAt)}
                </div>
              </div>

              {/* Target */}
              {report.targetTitle && (
                <p style={{ fontSize: '15px', fontWeight: '600', color: '#f0f0f5', marginBottom: '6px' }}>
                  "{report.targetTitle}"
                </p>
              )}

              {/* Reason */}
              <div style={{
                display: 'inline-block', padding: '4px 10px', borderRadius: '20px',
                background: 'rgba(245,87,108,0.15)', border: '1px solid rgba(245,87,108,0.3)',
                fontSize: '13px', color: '#ff8097', marginBottom: '8px'
              }}>
                {report.reason}
              </div>

              {/* Details */}
              {report.details && (
                <p style={{ fontSize: '13px', color: '#8b8fa8', marginBottom: '12px', lineHeight: '1.5' }}>
                  {report.details}
                </p>
              )}

              {/* Reporter */}
              <p style={{ fontSize: '12px', color: '#555870', marginBottom: report.status === 'pending' ? '14px' : '0' }}>
                Reported by: {report.reportedBy?.slice(0, 8)}...
              </p>

              {/* Actions */}
              {report.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleResolve(report.id, 'dismissed')}
                    disabled={resolving === report.id}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
                      background: '#252838', color: '#8b8fa8', fontSize: '13px', fontWeight: '600',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                  >
                    <XCircle size={15} /> Dismiss
                  </button>
                  <button
                    onClick={() => handleResolve(report.id, 'actioned')}
                    disabled={resolving === report.id}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                      color: 'white', fontSize: '13px', fontWeight: '600',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                  >
                    <CheckCircle size={15} /> Action
                  </button>
                </div>
              )}

              {report.status !== 'pending' && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '4px 10px', borderRadius: '20px',
                  background: report.status === 'actioned' ? 'rgba(79,172,254,0.15)' : 'rgba(255,255,255,0.07)',
                  fontSize: '12px', fontWeight: '600',
                  color: report.status === 'actioned' ? '#4facfe' : '#8b8fa8'
                }}>
                  {report.status === 'actioned' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  {report.status === 'actioned' ? 'Actioned' : 'Dismissed'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminScreen;
