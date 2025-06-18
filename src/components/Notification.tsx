import React, { useEffect, useState } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX, FiXCircle, FiEye, FiEyeOff } from 'react-icons/fi';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationProps {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
  onClose: (id: string) => void;
}

const iconMap = {
  success: FiCheckCircle,
  error: FiXCircle,
  info: FiInfo,
  warning: FiAlertCircle,
};

const bgColorMap = {
  success: 'bg-green-500/10 border-green-500/30',
  error: 'bg-red-500/10 border-red-500/30',
  info: 'bg-blue-500/10 border-blue-500/30',
  warning: 'bg-yellow-500/10 border-yellow-500/30',
};

const textColorMap = {
  success: 'text-green-400',
  error: 'text-red-400',
  info: 'text-blue-400',
  warning: 'text-yellow-400',
};

const Notification: React.FC<NotificationProps> = ({
  id,
  message,
  type = 'info',
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const [startTime, setStartTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(duration);

  const Icon = iconMap[type];
  const bgColor = bgColorMap[type];
  const textColor = textColorMap[type];

  // Handle auto-dismissal
  useEffect(() => {
    if (duration === 0) return;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setTimeRemaining(remaining);
      setProgress((remaining / duration) * 100);

      if (remaining <= 0) {
        handleClose();
      }
    }, 10);

    return () => clearInterval(timer);
  }, [duration, startTime]);

  // Handle exit animation
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose(id);
    }, 300);
  };

  // Pause timer on hover
  const handleMouseEnter = () => {
    if (duration === 0) return;
    setProgress((timeRemaining / duration) * 100);
  };

  // Resume timer on mouse leave
  const handleMouseLeave = () => {
    if (duration === 0) return;
    setStartTime(Date.now() - (duration - timeRemaining));
  };

  if (!isVisible) return null;

  return (
    <div
      className={`relative mb-2 overflow-hidden rounded-lg border backdrop-blur-sm transition-all duration-300 ease-in-out ${
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      } ${bgColor} border-opacity-30`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 mt-0.5 ${textColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-white">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              type="button"
              className="inline-flex text-gray-400 hover:text-white focus:outline-none"
              onClick={handleClose}
            >
              <span className="sr-only">Fermer</span>
              <FiX className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
      {duration > 0 && (
        <div className="h-0.5 bg-gray-700/30 w-full overflow-hidden">
          <div
            className={`h-full ${bgColor.replace('bg-opacity-10', 'bg-opacity-70')}`}
            style={{
              width: `${progress}%`,
              transition: 'width 0.1s linear',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Notification;
