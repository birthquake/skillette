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
            <Bell size={22} style={{ color: '#667eea' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a1a' }}>
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
                  color: '#667eea', fontSize: '13px', fontWeight: '600'
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
                color: '#666', fontSize: '22px', lineHeight: 1
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
                background: notification.read ? 'white' : 'linear-gradient(135deg, #f0f4ff 0%, #faf0ff 100%)',
                borderRadius: '14px',
                padding: '16px',
                border: notification.read ? '1px solid #e2e8f0' : '1px solid #c4b5fd',
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
                  ? '#f8fafc'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', flexShrink: 0
              }}>
                {notification.skillThumbnail || '🎯'}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '15px', fontWeight: notification.read ? '500' : '700',
                  color: '#1a1a1a', marginBottom: '4px'
                }}>
                  {notification.title}
                </p>
                <p style={{
                  fontSize: '13px', color: '#555', lineHeight: '1.5'
                }}>
                  {notification.body}
                </p>
                <p style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>
                  {formatTime(notification.createdAt)}
                </p>
              </div>

              {/* Unread dot */}
              {!notification.read && (
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  background: '#667eea', flexShrink: 0, marginTop: '4px'
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
