import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number;
}

interface NotificationProps {
  notification: Notification;
  onClose: (id: string) => void;
}

function NotificationItem({ notification, onClose }: NotificationProps) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: 'border-green-500 bg-green-950/30 text-green-400',
    error: 'border-red-500 bg-red-950/30 text-red-400',
    warning: 'border-yellow-500 bg-yellow-950/30 text-yellow-400',
    info: 'border-blue-500 bg-blue-950/30 text-blue-400',
  };

  const Icon = icons[notification.type];

  useEffect(() => {
    if (notification.duration !== 0) {
      const timer = setTimeout(() => {
        onClose(notification.id);
      }, notification.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [notification.id, notification.duration, onClose]);

  return (
    <div
      className={`terminal-box border-2 ${colors[notification.type]} p-4 mb-3 min-w-[300px] max-w-[500px] animate-in slide-in-from-top-5`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            {notification.title && (
              <div className="font-bold mb-1">{notification.title}</div>
            )}
            <div className="text-sm">{notification.message}</div>
          </div>
        </div>
        <button
          onClick={() => onClose(notification.id)}
          className="text-current opacity-70 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (
    type: NotificationType,
    message: string,
    title?: string,
    duration?: number
  ) => {
    const id = Math.random().toString(36).substring(7);
    const notification: Notification = {
      id,
      type,
      message,
      title,
      duration: duration !== undefined ? duration : 5000,
    };

    setNotifications((prev) => [...prev, notification]);
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const NotificationContainer = () => (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  );

  return {
    addNotification,
    removeNotification,
    NotificationContainer,
  };
}
