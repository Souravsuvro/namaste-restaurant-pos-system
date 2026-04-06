import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import toast from 'react-hot-toast';

export function Login() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = useCallback(
    async (fullPin: string) => {
      setLoading(true);
      setError(false);
      try {
        await login(fullPin);
        toast.success('Welcome back!');
        navigate('/');
      } catch {
        setError(true);
        setPin('');
        toast.error('Invalid PIN. Please try again.');
        setTimeout(() => setError(false), 500);
      } finally {
        setLoading(false);
      }
    },
    [login, navigate]
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (pin.length >= 4) return;
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        handleSubmit(newPin);
      }
    },
    [pin, handleSubmit]
  );

  const handleBackspace = useCallback(() => {
    setPin((p) => p.slice(0, -1));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleBackspace]);

  const numButtons = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-saffron/20 border border-saffron/30 mb-4">
            <span className="text-3xl font-bold text-saffron">N</span>
          </div>
          <h1 className="text-2xl font-bold text-cream">Namaste GIEN</h1>
          <p className="text-sm text-cream/40 mt-1">Point of Sale System</p>
        </div>

        {/* PIN Display */}
        <div className="text-center mb-8">
          <p className="text-sm text-cream/60 mb-4">Enter your PIN</p>
          <div className={`flex items-center justify-center gap-4 ${error ? 'animate-shake' : ''}`}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`
                  w-4 h-4 rounded-full transition-all duration-200
                  ${
                    i < pin.length
                      ? 'bg-saffron scale-110 shadow-lg shadow-saffron/40'
                      : 'bg-[#1e3a5f]'
                  }
                  ${error ? 'bg-tandoori' : ''}
                `}
              />
            ))}
          </div>
        </div>

        {/* NumPad */}
        <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
          {numButtons.map((btn, i) => {
            if (btn === '') return <div key={i} />;
            if (btn === 'back') {
              return (
                <button
                  key={i}
                  onClick={handleBackspace}
                  disabled={loading}
                  className="h-16 rounded-2xl bg-[#162a4a] border border-[#1e3a5f] flex items-center justify-center text-cream/60 hover:bg-[#1a3052] hover:text-cream active:bg-[#1e3a5f] transition-all disabled:opacity-50"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    <line x1="18" y1="9" x2="12" y2="15" />
                    <line x1="12" y1="9" x2="18" y2="15" />
                  </svg>
                </button>
              );
            }
            return (
              <button
                key={i}
                onClick={() => handleDigit(btn)}
                disabled={loading || pin.length >= 4}
                className="h-16 rounded-2xl bg-[#162a4a] border border-[#1e3a5f] flex items-center justify-center text-2xl font-semibold text-cream hover:bg-[#1a3052] active:bg-[#1e3a5f] active:scale-95 transition-all disabled:opacity-50"
              >
                {btn}
              </button>
            );
          })}
        </div>

        {loading && (
          <div className="mt-6 flex justify-center">
            <div className="w-6 h-6 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
