import React from 'react';
import { useToast } from '../context/ToastContext';
import styles from '../styles/Toast.module.scss';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`${styles.toast} ${styles[toast.type]}`}
          onClick={() => removeToast(toast.id)}
        >
          <span className={styles.message}>{toast.message}</span>
          <button className={styles.close} onClick={() => removeToast(toast.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
