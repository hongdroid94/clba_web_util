import React from 'react';
import './Toast.css';

interface ToastProps {
  message: string;
  isVisible: boolean;
}

const Toast: React.FC<ToastProps> = ({ message, isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div className="toast">
      {message}
    </div>
  );
};

export default Toast; 