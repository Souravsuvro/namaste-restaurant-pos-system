import { useState } from 'react';
import { Percent, DollarSign, Tag } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { NumPad } from './NumPad';
import { useCartStore } from '@/store/cart-store';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DiscountMode = 'percentage' | 'fixed' | 'promo';

export function DiscountModal({ isOpen, onClose }: DiscountModalProps) {
  const [mode, setMode] = useState<DiscountMode>('percentage');
  const [value, setValue] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const { setDiscount, getSubtotal } = useCartStore();

  const subtotal = getSubtotal();

  const presetPercentages = [10, 15, 20, 25];

  const handleApply = () => {
    if (mode === 'percentage') {
      const pct = parseFloat(value || '0');
      if (pct > 0 && pct <= 100) {
        setDiscount(pct, 'percentage');
      }
    } else if (mode === 'fixed') {
      const amount = parseFloat(value || '0');
      if (amount > 0) {
        setDiscount(amount, 'fixed');
      }
    } else if (mode === 'promo') {
      // In a real app, validate promo code via API
      setDiscount(10, 'percentage');
    }
    onClose();
  };

  const previewAmount =
    mode === 'percentage'
      ? subtotal * (parseFloat(value || '0') / 100)
      : mode === 'fixed'
        ? parseFloat(value || '0')
        : 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply Discount" size="md">
      {/* Mode selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setMode('percentage'); setValue(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
            mode === 'percentage'
              ? 'bg-saffron/20 border-saffron/50 text-saffron'
              : 'bg-[#0f1f3d] border-[#1e3a5f] text-cream/60'
          }`}
        >
          <Percent size={16} />
          Percentage
        </button>
        <button
          onClick={() => { setMode('fixed'); setValue(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
            mode === 'fixed'
              ? 'bg-saffron/20 border-saffron/50 text-saffron'
              : 'bg-[#0f1f3d] border-[#1e3a5f] text-cream/60'
          }`}
        >
          <DollarSign size={16} />
          Fixed Amount
        </button>
        <button
          onClick={() => { setMode('promo'); setValue(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${
            mode === 'promo'
              ? 'bg-saffron/20 border-saffron/50 text-saffron'
              : 'bg-[#0f1f3d] border-[#1e3a5f] text-cream/60'
          }`}
        >
          <Tag size={16} />
          Promo Code
        </button>
      </div>

      {mode === 'percentage' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {presetPercentages.map((pct) => (
              <button
                key={pct}
                onClick={() => setValue(String(pct))}
                className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                  value === String(pct)
                    ? 'bg-saffron/20 border-saffron/50 text-saffron'
                    : 'bg-[#0f1f3d] border-[#1e3a5f] text-cream/60 hover:border-cream/30'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
          <div className="text-center mb-2">
            <span className="text-sm text-cream/60">Custom percentage</span>
            <div className="text-3xl font-bold text-cream mt-1">{value || '0'}%</div>
          </div>
          <NumPad value={value} onChange={setValue} showDecimal={false} />
        </div>
      )}

      {mode === 'fixed' && (
        <div className="space-y-4">
          <div className="text-center mb-2">
            <span className="text-sm text-cream/60">Discount amount</span>
            <div className="text-3xl font-bold text-cream mt-1">
              {'\u20AC'}{value || '0.00'}
            </div>
          </div>
          <NumPad value={value} onChange={setValue} />
        </div>
      )}

      {mode === 'promo' && (
        <div className="space-y-4">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Enter promo code"
            className="w-full bg-[#0f1f3d] border border-[#1e3a5f] rounded-xl px-4 py-3 text-cream text-lg text-center font-mono tracking-wider focus:outline-none focus:border-saffron/50 placeholder:text-cream/20"
          />
        </div>
      )}

      {previewAmount > 0 && mode !== 'promo' && (
        <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <span className="text-sm text-emerald-400">
            Saves {'\u20AC'}{previewAmount.toFixed(2)}
          </span>
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <Button
          variant="ghost"
          size="lg"
          className="flex-1 border border-[#1e3a5f]"
          onClick={() => {
            setDiscount(0, 'percentage');
            onClose();
          }}
        >
          Remove Discount
        </Button>
        <Button variant="primary" size="lg" className="flex-1" onClick={handleApply}>
          Apply
        </Button>
      </div>
    </Modal>
  );
}
