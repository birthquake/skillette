import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Loader } from 'lucide-react';
import { getAllNotifications, markAllNotificationsRead, markNotificationRead } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

function NotificationsScreen({ onClose }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getAllNotifications(currentUser.uid);
      setNotifications(data);
      setLoading(false);
    };
    load();
  }, [currentUser.uid]);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(currentUser.uid);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const formatTime = (createdAt) => {
    if (!createdAt) return '';
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fade-in" style={{ paddingTop: '20px', paddingBottom: '20px' }}>

      {/* Header */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={22} style={{ color: '#7c6af7' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f0f0f5' }}>
              Notifications
            </h2>
            {unreadCount > 0 && (
              <div style={{
                background: '#f5576c', color: 'white',
                borderRadius: '20px', padding: '2px 8px',
                fontSize: '12px', fontWeight: '700'
              }}>
                {unreadCount}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  color: '#7c6af7', fontSize: '13px', fontWeight: '600'
                }}
              >
                <CheckCheck size={15} />
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#8b8fa8', fontSize: '22px', lineHeight: 1
              }}
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: '60px', color: 'white' }}>
          <Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
          <p>Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: '60px', color: 'white' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🔔</div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
            No notifications yet
          </h3>
          <p style={{ fontSize: '15px', opacity: 0.8 }}>
            When someone learns your skill you'll see it here.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => !notification.read && handleMarkRead(notification.id)}
              style={{
                background: notification.read ? '#1a1d27' : 'linear-gradient(135deg, rgba(124,106,247,0.12) 0%, rgba(156,89,245,0.08) 100%)',
                borderRadius: '14px',
                padding: '16px',
                border: notification.read ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(124,106,247,0.4)',
                cursor: notification.read ? 'default' : 'pointer',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                position: 'relative'
              }}
            >
              {/* Icon */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: notification.read
                  ? '#252838'
                  : 'linear-gradient(135deg, #7c6af7 0%, #9c59f5 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', flexShrink: 0
              }}>
                {notification.skillThumbnail || '🎯'}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '15px', fontWeight: notification.read ? '500' : '700',
                  color: '#f0f0f5', marginBottom: '4px'
                }}>
                  {notification.title}
                </p>
                <p style={{
                  fontSize: '13px', color: '#8b8fa8', lineHeight: '1.5'
                }}>
                  {notification.body}
                </p>
                <p style={{ fontSize: '12px', color: '#555870', marginTop: '6px' }}>
                  {formatTime(notification.createdAt)}
                </p>
              </div>

              {/* Unread dot */}
              {!notification.read && (
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: '#7c6af7', flexShrink: 0, marginTop: '4px'
                }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsScreen;
