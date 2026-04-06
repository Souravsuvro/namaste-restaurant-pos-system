import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showClose?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] max-h-[95vh]',
};

export function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  showClose = true,
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`
          relative w-full ${sizeClasses[size]}
          bg-[#162a4a] border border-[#2a4a72]
          rounded-2xl shadow-2xl shadow-black/40
          animate-slide-in
          flex flex-col max-h-[90vh]
        `}
      >
        {(title || showClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e3a5f]">
            {title && (
              <h2 className="text-lg font-semibold text-cream">{title}</h2>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-cream/60 hover:text-cream ml-auto"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-[#1e3a5f] flex items-center gap-3 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
