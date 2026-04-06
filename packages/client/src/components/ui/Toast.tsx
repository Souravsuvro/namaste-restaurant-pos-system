import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#1a3052',
          color: '#FDF6EC',
          border: '1px solid #2a4a72',
          borderRadius: '12px',
          fontSize: '14px',
          padding: '12px 16px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#FDF6EC',
          },
        },
        error: {
          iconTheme: {
            primary: '#C23B22',
            secondary: '#FDF6EC',
          },
        },
      }}
    />
  );
}
